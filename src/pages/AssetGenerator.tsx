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
    toast.info("Starting 3D model generation...");

    try {
      // TODO: Implement Meshy API call through edge function
      // For now, just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("3D model generation started! This is a placeholder.");
      setGeneratedModelUrl("placeholder-url");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate 3D model");
    } finally {
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
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Placeholder: Meshy API integration coming soon
                  </p>
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
