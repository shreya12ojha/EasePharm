"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileImage, Loader2, Eye, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [ocrMethod, setOcrMethod] = useState("");

  // ❗ Unused state: 'ocrEngine' – planned for future use (currently unused, causes ESLint warning)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ocrEngine, setOcrEngine] = useState("auto");

  const [enhanceImage, setEnhanceImage] = useState(true);
  const { toast } = useToast();

  // ... rest of your code remains unchanged

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const enhanceImageForOCR = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      // Increase contrast
      const contrast = 1.5;
      const enhanced = Math.min(
        255,
        Math.max(0, contrast * (gray - 128) + 128)
      );
      data[i] = enhanced; // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const processWithTesseract = async (
    imageData: string
  ): Promise<{ text: string; confidence: number }> => {
    try {
      // Dynamic import of Tesseract.js
      const { createWorker } = await import("tesseract.js");

      setProgress(0);
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          console.log("Tesseract progress:", m);
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Configure Tesseract for better handwriting recognition
      await worker.setParameters({
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-/() ",
        tessedit_pageseg_mode: "6", // Uniform block of text
      });

      const {
        data: { text, confidence },
      } = await worker.recognize(imageData);

      await worker.terminate();

      return { text: text.trim(), confidence };
    } catch (error) {
      console.error("Tesseract Error:", error);
      throw new Error("Client-side OCR failed");
    }
  };

  const processImage = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setOcrMethod("");
    setExtractedText("");

    try {
      // First try server-side OCR
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (data.success) {
        if (data.text && data.method !== "client-side") {
          // Server-side OCR successful
          setExtractedText(data.text);
          setOcrMethod(data.method);
          toast({
            title: "Success",
            description: `Text extracted using ${data.method}`,
          });
        } else {
          // Use client-side OCR with Tesseract.js
          setOcrMethod("Tesseract.js (Client-side)");
          toast({
            title: "Processing",
            description: "Using client-side OCR...",
          });

          let imageData = data.imageData || preview;

          if (enhanceImage && imageData) {
            // Enhance image for better OCR
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
              img.onload = async () => {
                try {
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d")!;
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);

                  imageData = enhanceImageForOCR(canvas, ctx);
                  resolve();
                } catch (error) {
                  reject(error);
                }
              };
              img.onerror = reject;
              img.src = imageData!;
            });
          }

          // Process with Tesseract
          const result = await processWithTesseract(imageData!);
          setExtractedText(result.text);

          toast({
            title: "Success",
            description: `Text extracted with ${Math.round(
              result.confidence
            )}% confidence`,
          });
        }
      } else {
        throw new Error(data.error || "Failed to process image");
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const createOrder = async () => {
    if (!extractedText) return;

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionText: extractedText }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Order Created",
          description: `Order #${data.orderId} created successfully`,
        });

        // Reset form
        setFile(null);
        setPreview(null);
        setExtractedText("");
        setOcrMethod("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Prescription</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload & Configure</CardTitle>
              <CardDescription>
                Upload prescription image and configure OCR settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {preview ? (
                  <div className="space-y-2">
                    <Image
                      src={preview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full h-48 object-contain mx-auto rounded"
                    />
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span>{file?.name}</span>
                      <span>({Math.round((file?.size || 0) / 1024)} KB)</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No image selected</p>
                    <p className="text-xs text-gray-400 mt-1">Max size: 10MB</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="image">Select Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <Label className="text-sm font-medium">OCR Settings</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enhance"
                    checked={enhanceImage}
                    onCheckedChange={setEnhanceImage}
                  />
                  <Label htmlFor="enhance" className="text-sm">
                    Enhance image for better OCR
                  </Label>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing with {ocrMethod}</span>
                    {progress > 0 && <span>{progress}%</span>}
                  </div>
                  {progress > 0 && (
                    <Progress value={progress} className="w-full" />
                  )}
                </div>
              )}

              <Button
                onClick={processImage}
                disabled={!file || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Extract Text
                  </>
                )}
              </Button>

              {ocrMethod && (
                <div className="text-xs text-center space-y-1">
                  <p className="text-gray-500">Processed using: {ocrMethod}</p>
                  {extractedText && (
                    <p className="text-green-600">
                      ✓ {extractedText.length} characters extracted
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extracted Text</CardTitle>
              <CardDescription>
                Review and edit the extracted prescription text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Extracted text will appear here..."
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />

              <div className="flex space-x-2">
                <Button
                  onClick={createOrder}
                  disabled={!extractedText}
                  className="flex-1"
                >
                  Create Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setExtractedText("")}
                  disabled={!extractedText}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>OCR Status & Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Current Configuration:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>
                    • OCR.space API:{" "}
                    {process.env.OCR_SPACE_API_KEY
                      ? "✅ Configured"
                      : "❌ Not configured"}
                  </li>
                  <li>
                    • Azure Vision:{" "}
                    {process.env.AZURE_VISION_KEY
                      ? "✅ Configured"
                      : "❌ Not configured"}
                  </li>
                  <li>• Tesseract.js: ✅ Always available (client-side)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Tips for Better Results:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Use high-contrast images</li>
                  <li>• Ensure text is clearly visible</li>
                  <li>• Avoid shadows and glare</li>
                  <li>• Keep prescription flat</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
