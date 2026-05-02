import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { postService } from "../api/postService";
import { aiService } from "../api/aiService";
import toast from "react-hot-toast";

function CreatePost() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max file size is 10 MB"); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateCaption = async () => {
    if (!aiContext.trim()) { toast.error("Describe your photo first"); return; }
    setGeneratingCaption(true);
    try {
      const suggestions = await aiService.generateCaption(aiContext);
      setAiSuggestions(suggestions);
    } catch {
      toast.error("Failed to generate captions. Check your Gemini API key.");
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { toast.error("Please select an image"); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("caption", caption);
      await postService.createPost(formData);
      toast.success("Post created!");
      navigate("/feed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-lg mx-auto">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="gradient-text text-2xl font-black mb-6">
          Create Post
        </motion.h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <div
            className={`glass-card p-6 text-center cursor-pointer transition-all duration-200 ${preview ? "p-0 overflow-hidden" : "border-dashed border-2 border-cyan-400/30 hover:border-cyan-400/60"}`}
            onClick={() => !preview && fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="Preview" className="w-full max-h-96 object-cover rounded-2xl" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); }} className="btn-ghost text-sm">
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8">
                <p className="text-4xl mb-3">📸</p>
                <p className="text-white font-semibold mb-1">Drop your photo here</p>
                <p className="text-gray-500 text-sm">or click to browse · JPG, PNG, WebP · max 10 MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Caption</label>
              <button
                type="button"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="text-xs text-cyan-400 font-semibold hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                🤖 AI Caption
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="input-field resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-gray-600 text-xs text-right mt-1">{caption.length}/500</p>
          </div>

          {/* AI Caption Panel */}
          <AnimatePresence>
            {showAiPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-4 space-y-3 overflow-hidden"
              >
                <p className="text-cyan-400 font-bold text-sm">🤖 AI Caption Generator</p>
                <div className="flex gap-2">
                  <input
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="Describe your photo (e.g. sunset at the beach)"
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCaption}
                    disabled={generatingCaption}
                    className="btn-primary px-4 text-sm whitespace-nowrap"
                  >
                    {generatingCaption ? <div className="spinner" style={{ width: 16, height: 16 }} /> : "Generate"}
                  </button>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {aiSuggestions.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-cyan-400/40 transition-all"
                        onClick={() => {
                          const full = `${s.caption} ${s.hashtags?.join(" ") || ""}`.trim();
                          setCaption(full);
                          setShowAiPanel(false);
                          toast.success("Caption applied!");
                        }}
                      >
                        <p className="text-white text-sm">{s.caption}</p>
                        {s.hashtags?.length > 0 && (
                          <p className="text-cyan-400 text-xs mt-1">{s.hashtags.join(" ")}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={submitting || !image} className="btn-primary w-full py-3 text-base">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner" style={{ width: 18, height: 18 }} /> Uploading...
              </span>
            ) : "Share Post"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;
