import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Upload, Wand2 } from "lucide-react";

export const AssetGenerator = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast.error("Please upload a JPG or PNG image");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (!imagePreview) {
      toast.error("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    toast.info("Starting 3D model generation... This may take a few minutes.");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Start the generation
      const startResponse = await fetch(`${supabaseUrl}/functions/v1/generate-3d-model`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          imageBase64: imagePreview,
        }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || "Failed to start generation");
      }

      const startData = await startResponse.json();
      const taskId = startData.result;

      console.log("Task started:", taskId);
      toast.success("Generation started! Checking progress...");

      // Poll for status
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5 seconds * 60)

      const checkStatus = async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
          throw new Error("Generation timeout - please try again");
        }

        const statusResponse = await fetch(`${supabaseUrl}/functions/v1/generate-3d-model`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: "status",
            taskId,
          }),
        });

        if (!statusResponse.ok) {
          throw new Error("Failed to check status");
        }

        const statusData = await statusResponse.json();
        console.log("Status:", statusData);

        if (statusData.status === "SUCCEEDED") {
          toast.success("3D model generated successfully!");
          setGeneratedModelUrl(statusData.model_urls?.glb || statusData.model_urls?.fbx);
          setIsGenerating(false);
        } else if (statusData.status === "FAILED") {
          throw new Error("Generation failed");
        } else {
          // Still processing, check again in 5 seconds
          setTimeout(checkStatus, 5000);
        }
      };

      // Start checking status
      setTimeout(checkStatus, 5000);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate 3D model");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Game
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">3D Asset Generator</h1>
            <p className="text-muted-foreground">
              Generate 3D character models from images using AI
            </p>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
                
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onPaste={handlePaste}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Click to upload or paste an image
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports JPG and PNG
                      </p>
                    </div>
                  )}
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {imagePreview && (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  {isGenerating ? "Generating..." : "Generate 3D Model"}
                </Button>
              )}

              {generatedModelUrl && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Generated Model</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your 3D model has been generated successfully!
                    </p>
                    <Button
                      onClick={() => window.open(generatedModelUrl, "_blank")}
                      className="w-full"
                    >
                      Download GLB Model
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-2">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. Upload or paste an image of a character</li>
              <li>2. AI will generate a 3D model from the image</li>
              <li>3. Download and use the model in the game</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
