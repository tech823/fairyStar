import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Star,
  GripVertical,
  Loader2,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
} from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});

// Drag and drop file uploader
const FileUploader = ({
  onFilesSelected,
  disabled,
  accept = "image/*,video/*",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFilesSelected(Array.from(files));
      }
    },
    [onFilesSelected],
  );

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
        ${isDragOver ? "border-brand-orange bg-brand-orange/10" : "border-white/20 hover:border-white/40"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      data-testid="media-drop-zone"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <Upload
        className={`mx-auto mb-3 ${isDragOver ? "text-brand-orange" : "text-white/40"}`}
        size={40}
      />
      <p className="text-white font-medium mb-1">
        {isDragOver
          ? "Drop files here"
          : "Drag & drop files or click to upload"}
      </p>
      <p className="text-white/40 text-sm">
        Images: JPG, PNG, WebP (max 10MB) · Videos: MP4 (max 200MB)
      </p>
    </div>
  );
};

// Upload progress item
const UploadProgress = ({ file, progress, status, error }) => (
  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
      {file.type.startsWith("video") ? (
        <Video size={20} className="text-white/60" />
      ) : (
        <ImageIcon size={20} className="text-white/60" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm truncate">{file.name}</p>
      <div className="flex items-center gap-2 mt-1">
        {status === "uploading" && (
          <>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-orange transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white/40 text-xs">{progress}%</span>
          </>
        )}
        {status === "success" && (
          <span className="text-green-400 text-xs flex items-center gap-1">
            <CheckCircle size={14} /> Uploaded
          </span>
        )}
        {status === "error" && (
          <span className="text-red-400 text-xs flex items-center gap-1">
            <AlertCircle size={14} /> {error}
          </span>
        )}
      </div>
    </div>
  </div>
);

// Media item in gallery
const MediaItem = ({
  media,
  onDelete,
  onSetCover,
  onEditMetadata,
  isDragging,
  dragHandleProps,
}) => {
  const isVideo = media.type === "video";
  const hasVideoLink = media.video_link;

  return (
    <div
      className={`relative group bg-slate-700 rounded-lg overflow-hidden border ${
        media.is_cover ? "border-brand-orange" : "border-white/10"
      } ${isDragging ? "opacity-50" : ""}`}
      data-testid={`media-item-${media.id}`}
    >
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="absolute top-2 left-2 z-10 p-1.5 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
      >
        <GripVertical size={16} className="text-white" />
      </div>

      {/* Cover Badge */}
      {media.is_cover && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-brand-orange rounded text-xs text-slate-900 font-medium">
          Cover
        </div>
      )}

      {/* Media Preview */}
      <div className="aspect-[4/3] relative">
        {isVideo && hasVideoLink ? (
          <div className="w-full h-full flex items-center justify-center bg-black/30">
            <a
              href={media.video_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white"
            >
              <Video size={32} />
              <span className="text-xs mt-1 block">Video Link</span>
            </a>
          </div>
        ) : isVideo ? (
          <video src={media.url} className="w-full h-full object-cover" />
        ) : (
          <img
            src={media.url}
            alt={media.alt_text || ""}
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {!media.is_cover && !isVideo && (
            <Button
              size="sm"
              onClick={() => onSetCover(media.id)}
              className="bg-brand-orange text-slate-900 hover:bg-brand-orange-dark"
            >
              <Star size={14} className="mr-1" /> Set Cover
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEditMetadata(media)}
            className="text-white hover:bg-white/20"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(media.id)}
            className="text-red-400 hover:bg-red-500/20"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Caption */}
      {media.caption && (
        <div className="p-2 border-t border-white/10">
          <p className="text-white/60 text-xs truncate">{media.caption}</p>
        </div>
      )}
    </div>
  );
};

// Main Media Manager Component
export default function PropertyMediaManager({ propertyId, onMediaChange }) {
  const [media, setMedia] = useState([]);
  const [storageConfig, setStorageConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState([]);
  const [showVideoLinkModal, setShowVideoLinkModal] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [editingMedia, setEditingMedia] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  // Fetch media on mount
  useEffect(() => {
    fetchMedia();
    fetchStorageConfig();
  }, [propertyId]);

  const fetchMedia = async () => {
    try {
      const res = await axios.get(
        `${API}/admin/properties/${propertyId}/media`,
        { headers: getAuthHeaders() },
      );
      setMedia(res.data.media || []);
    } catch (err) {
      console.error("Error fetching media:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageConfig = async () => {
    try {
      const res = await axios.get(`${API}/admin/storage/settings`, {
        headers: getAuthHeaders(),
      });
      setStorageConfig(res.data);
    } catch (err) {
      console.error("Error fetching storage config:", err);
    }
  };

  const handleFilesSelected = async (files) => {
    // Add files to upload queue
    const newUploads = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: "pending",
    }));
    setUploads((prev) => [...prev, ...newUploads]);

    // Process uploads
    for (const upload of newUploads) {
      await processUpload(upload);
    }
  };

  const processUpload = async (upload) => {
    const { file, id } = upload;

    // Update status to uploading
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: "uploading", progress: 0 } : u,
      ),
    );

    try {
      // 1. Get pre-signed URL
      const presignRes = await axios.post(
        `${API}/admin/properties/${propertyId}/media/presign`,
        {
          filename: file.name,
          content_type: file.type,
          size_bytes: file.size,
        },
        { headers: getAuthHeaders() },
      );

      if (
        presignRes.data.status === "disabled" ||
        presignRes.data.status === "not_configured"
      ) {
        // Fall back to URL-based upload
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "error",
                  error: "Cloud storage not configured. Use URL method.",
                }
              : u,
          ),
        );
        return;
      }

      const { upload_url, storage_key, public_url, media_type } =
        presignRes.data;

      // 2. Upload directly to S3/R2
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, progress: 30 } : u)),
      );

      await axios.put(upload_url, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          const percent =
            Math.round((progressEvent.loaded * 70) / progressEvent.total) + 30;
          setUploads((prev) =>
            prev.map((u) =>
              u.id === id ? { ...u, progress: Math.min(percent, 95) } : u,
            ),
          );
        },
      });

      // 3. Confirm upload
      const confirmRes = await axios.post(
        `${API}/admin/properties/${propertyId}/media/confirm`,
        {
          storage_key,
          public_url,
          media_type,
          caption: "",
          alt_text: file.name.split(".")[0],
        },
        { headers: getAuthHeaders() },
      );

      setUploads((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: "success", progress: 100 } : u,
        ),
      );

      // Add to media list
      if (confirmRes.data.media) {
        setMedia((prev) => [...prev, confirmRes.data.media]);
        onMediaChange?.();
      }

      toast.success(`${file.name} uploaded successfully`);
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg =
        err.response?.data?.detail || err.message || "Upload failed";
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: "error", error: errorMsg } : u,
        ),
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const handleDelete = async (mediaId) => {
    if (!window.confirm("Delete this media?")) return;

    try {
      await axios.delete(
        `${API}/admin/properties/${propertyId}/media/cloud/${mediaId}`,
        { headers: getAuthHeaders() },
      );
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      onMediaChange?.();
      toast.success("Media deleted");
    } catch (err) {
      toast.error("Error deleting media");
    }
  };

  const handleSetCover = async (mediaId) => {
    try {
      await axios.put(
        `${API}/admin/properties/${propertyId}/media/${mediaId}/cover`,
        null,
        { headers: getAuthHeaders() },
      );
      setMedia((prev) =>
        prev.map((m) => ({ ...m, is_cover: m.id === mediaId })),
      );
      onMediaChange?.();
      toast.success("Cover image set");
    } catch (err) {
      toast.error("Error setting cover");
    }
  };

  const handleAddVideoLink = async () => {
    if (!videoLink) {
      toast.error("Enter a video link");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/admin/properties/${propertyId}/media/video-link`,
        {
          video_link: videoLink,
          thumbnail_url: videoThumbnail || null,
          caption: videoCaption || null,
        },
        { headers: getAuthHeaders() },
      );

      if (res.data.media) {
        setMedia((prev) => [...prev, res.data.media]);
        onMediaChange?.();
      }

      setShowVideoLinkModal(false);
      setVideoLink("");
      setVideoThumbnail("");
      setVideoCaption("");
      toast.success("Video link added");
    } catch (err) {
      toast.error("Error adding video link");
    }
  };

  const handleUpdateMetadata = async () => {
    if (!editingMedia) return;

    try {
      await axios.put(
        `${API}/admin/properties/${propertyId}/media/${editingMedia.id}/metadata`,
        {
          caption: editingMedia.caption,
          alt_text: editingMedia.alt_text,
        },
        { headers: getAuthHeaders() },
      );

      setMedia((prev) =>
        prev.map((m) =>
          m.id === editingMedia.id
            ? {
                ...m,
                caption: editingMedia.caption,
                alt_text: editingMedia.alt_text,
              }
            : m,
        ),
      );
      setEditingMedia(null);
      toast.success("Metadata updated");
    } catch (err) {
      toast.error("Error updating metadata");
    }
  };

  const handleReorder = async (fromIndex, toIndex) => {
    const newMedia = [...media];
    const [removed] = newMedia.splice(fromIndex, 1);
    newMedia.splice(toIndex, 0, removed);

    setMedia(newMedia);

    try {
      await axios.put(
        `${API}/admin/properties/${propertyId}/media/reorder`,
        newMedia.map((m) => m.id),
        { headers: getAuthHeaders() },
      );
      onMediaChange?.();
    } catch (err) {
      toast.error("Error reordering media");
      fetchMedia(); // Revert on error
    }
  };

  // Simple drag handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    handleReorder(draggedItem, index);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Clear completed uploads
  const clearCompletedUploads = () => {
    setUploads((prev) =>
      prev.filter((u) => u.status === "uploading" || u.status === "pending"),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-orange" size={32} />
      </div>
    );
  }

  const storageNotConfigured = !storageConfig?.configured;

  return (
    <div className="space-y-6" data-testid="property-media-manager">
      {/* Storage Status */}
      {storageNotConfigured && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
            <div>
              <p className="text-yellow-400 font-medium">
                Cloud Storage Not Configured
              </p>
              <p className="text-white/60 text-sm mt-1">
                Direct file uploads are disabled. You can still add images via
                URL or video links. To enable uploads, configure R2/S3
                credentials in the backend .env file.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-slate-700 rounded-xl border border-white/10 p-6">
        <h3 className="font-heading text-lg font-bold text-white mb-4">
          Upload Media
        </h3>

        <FileUploader
          onFilesSelected={handleFilesSelected}
          disabled={storageNotConfigured}
        />

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">
                {uploads.length} file(s)
              </span>
              {uploads.some(
                (u) => u.status === "success" || u.status === "error",
              ) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearCompletedUploads}
                  className="text-white/40 hover:text-white"
                >
                  Clear completed
                </Button>
              )}
            </div>
            {uploads.map((upload) => (
              <UploadProgress key={upload.id} {...upload} />
            ))}
          </div>
        )}

        {/* Alternative: Video Link */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => setShowVideoLinkModal(true)}
          >
            <LinkIcon size={16} className="mr-2" /> Add Video Link
            (YouTube/Vimeo)
          </Button>
        </div>
      </div>

      {/* Media Gallery */}
      <div className="bg-slate-700 rounded-xl border border-white/10 p-6">
        <h3 className="font-heading text-lg font-bold text-white mb-4">
          Media Gallery ({media.length})
        </h3>

        {media.length === 0 ? (
          <p className="text-white/40 text-center py-8">No media added yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <MediaItem
                  media={item}
                  onDelete={handleDelete}
                  onSetCover={handleSetCover}
                  onEditMetadata={setEditingMedia}
                  isDragging={draggedItem === index}
                  dragHandleProps={{}}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Link Modal */}
      <Dialog open={showVideoLinkModal} onOpenChange={setShowVideoLinkModal}>
        <DialogContent className="bg-slate-700 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add Video Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">
                Video URL (YouTube/Vimeo)
              </label>
              <Input
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">
                Thumbnail URL (optional)
              </label>
              <Input
                value={videoThumbnail}
                onChange={(e) => setVideoThumbnail(e.target.value)}
                placeholder="https://..."
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">
                Caption (optional)
              </label>
              <Input
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="Property tour video"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowVideoLinkModal(false)}
                className="text-white/60"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddVideoLink}
                className="bg-brand-orange text-slate-900 hover:bg-brand-orange-dark"
              >
                Add Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Metadata Modal */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent className="bg-slate-700 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Media</DialogTitle>
          </DialogHeader>
          {editingMedia && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-black/30">
                {editingMedia.type === "video" && editingMedia.video_link ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <a
                      href={editingMedia.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-orange"
                    >
                      <ExternalLink size={24} />
                      <span className="text-sm block mt-1">View Video</span>
                    </a>
                  </div>
                ) : (
                  <img
                    src={editingMedia.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">
                  Caption
                </label>
                <Input
                  value={editingMedia.caption || ""}
                  onChange={(e) =>
                    setEditingMedia({
                      ...editingMedia,
                      caption: e.target.value,
                    })
                  }
                  placeholder="Enter caption..."
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">
                  Alt Text (for accessibility/SEO)
                </label>
                <Input
                  value={editingMedia.alt_text || ""}
                  onChange={(e) =>
                    setEditingMedia({
                      ...editingMedia,
                      alt_text: e.target.value,
                    })
                  }
                  placeholder="Describe the image..."
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setEditingMedia(null)}
                  className="text-white/60"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateMetadata}
                  className="bg-brand-orange text-slate-900 hover:bg-brand-orange-dark"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
