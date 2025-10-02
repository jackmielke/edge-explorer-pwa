import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Upload, Wand2, TestTube, Gamepad2 } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

export const AssetGenerator = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Model settings
  const [aiModel, setAiModel] = useState("latest"); // Meshy 6 Preview
  const [topology, setTopology] = useState<"quad" | "triangle">("triangle");
  const [targetPolycount, setTargetPolycount] = useState(30000);
  const [shouldTexture, setShouldTexture] = useState(true);
  const [enablePbr, setEnablePbr] = useState(true);
  const [texturePrompt, setTexturePrompt] = useState("");
  const [symmetryMode, setSymmetryMode] = useState<"off" | "auto" | "on">("auto");
  const [shouldRemesh, setShouldRemesh] = useState(true);

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

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-3d-model`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action: "test",
        }),
      });

      if (response.ok) {
        toast.success("✅ Meshy API connection successful!");
      } else {
        const error = await response.json();
        toast.error(`Connection failed: ${error.error}`);
      }
    } catch (error) {
      toast.error("Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  const handleGenerate = async () => {
    if (!imagePreview) {
      toast.error("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedModelUrl(null);
    setThumbnailUrl(null);
    toast.info("Starting 3D model generation...");

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
          aiModel,
          topology,
          targetPolycount,
          shouldTexture,
          enablePbr,
          texturePrompt: texturePrompt || undefined,
          symmetryMode,
          shouldRemesh,
        }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || "Failed to start generation");
      }

      const startData = await startResponse.json();
      const taskId = startData.result;

      console.log("Task started:", taskId);
      toast.success("Generation started! This may take 2-3 minutes...");

      // Poll for status
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max (5 seconds * 120)

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

        // Update progress
        if (statusData.progress) {
          setProgress(statusData.progress);
        }

        if (statusData.status === "SUCCEEDED") {
          setProgress(100);
          toast.success("🎉 3D model generated successfully!");
          setGeneratedModelUrl(statusData.model_urls?.glb);
          setThumbnailUrl(statusData.thumbnail_url);
          setIsGenerating(false);
        } else if (statusData.status === "FAILED") {
          throw new Error(statusData.task_error?.message || "Generation failed");
        } else if (statusData.status === "IN_PROGRESS" || statusData.status === "PENDING") {
          // Still processing, check again in 5 seconds
          setTimeout(checkStatus, 5000);
        }
      };

      // Start checking status after 5 seconds
      setTimeout(checkStatus, 5000);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate 3D model");
      setIsGenerating(false);
      setProgress(0);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">3D Asset Generator</h1>
              <p className="text-muted-foreground">
                Generate 3D models using Meshy 6 Preview AI
              </p>
            </div>
            <Button
              onClick={testConnection}
              disabled={isTesting}
              variant="outline"
              size="sm"
            >
              <TestTube className="mr-2 h-4 w-4" />
              {isTesting ? "Testing..." : "Test Connection"}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Image Upload Card */}
            <Card className="p-6">
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
            </Card>

            {/* Settings Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Generation Settings</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">AI Model</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger id="ai-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Meshy 6 Preview (Latest)</SelectItem>
                      <SelectItem value="meshy-5">Meshy 5</SelectItem>
                      <SelectItem value="meshy-4">Meshy 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topology">Topology</Label>
                  <Select value={topology} onValueChange={(v: "quad" | "triangle") => setTopology(v)}>
                    <SelectTrigger id="topology">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="triangle">Triangle Mesh</SelectItem>
                      <SelectItem value="quad">Quad-Dominant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="polycount">Target Polycount: {targetPolycount.toLocaleString()}</Label>
                  <Input
                    id="polycount"
                    type="number"
                    min={100}
                    max={300000}
                    value={targetPolycount}
                    onChange={(e) => setTargetPolycount(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symmetry">Symmetry Mode</Label>
                  <Select value={symmetryMode} onValueChange={(v: "off" | "auto" | "on") => setSymmetryMode(v)}>
                    <SelectTrigger id="symmetry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="texture">Generate Texture</Label>
                  <Switch
                    id="texture"
                    checked={shouldTexture}
                    onCheckedChange={setShouldTexture}
                  />
                </div>

                {shouldTexture && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pbr">Enable PBR Maps</Label>
                      <Switch
                        id="pbr"
                        checked={enablePbr}
                        onCheckedChange={setEnablePbr}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="texture-prompt">Texture Prompt (Optional)</Label>
                      <Textarea
                        id="texture-prompt"
                        placeholder="Describe the desired texture..."
                        value={texturePrompt}
                        onChange={(e) => setTexturePrompt(e.target.value)}
                        maxLength={600}
                      />
                      <p className="text-xs text-muted-foreground">
                        {texturePrompt.length}/600 characters
                      </p>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="remesh">Remesh</Label>
                  <Switch
                    id="remesh"
                    checked={shouldRemesh}
                    onCheckedChange={setShouldRemesh}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Generate Button */}
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

          {/* Progress Bar */}
          {isGenerating && (
            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Generating your 3D model...</p>
                  <p className="text-sm text-muted-foreground">{progress}%</p>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </Card>
          )}

          {/* Generated Model */}
          {generatedModelUrl && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">✨ Generated Model</h3>
              <div className="space-y-4">
                {/* 3D Viewer */}
                <div className="w-full h-96 bg-muted rounded-lg overflow-hidden">
                  <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
                    <Suspense fallback={null}>
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[10, 10, 5]} intensity={1} />
                      <Model url={generatedModelUrl} />
                      <OrbitControls enablePan={false} />
                    </Suspense>
                  </Canvas>
                </div>
                <div className="grid gap-2">
                  <Button
                    onClick={() => navigate(`/?character=${encodeURIComponent(generatedModelUrl)}`)}
                    className="w-full"
                    size="lg"
                  >
                    <Gamepad2 className="mr-2 h-5 w-5" />
                    Play as This Character
                  </Button>
                  <Button
                    onClick={() => window.open(generatedModelUrl, "_blank")}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Download GLB Model
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-2">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use clear, well-lit images for best results</li>
              <li>• Meshy 6 Preview offers the highest quality</li>
              <li>• Enable PBR for realistic materials</li>
              <li>• Generation typically takes 2-3 minutes</li>
              <li>• Higher polycount = more detail but larger file</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

// 3D Model Viewer Component
const Model = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  
  return <primitive object={scene} scale={1.5} />;
};
