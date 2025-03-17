import React, { useState, useRef } from "react";
import { toast } from "sonner";
import moment from "moment";
import {
  FaPlay,
  FaEllipsisH,
  FaPlus,
  FaImage,
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
  FaDownload,
  FaTrash,
} from "react-icons/fa";
import {
  useAddAttachmentMutation,
  useGetAttachmentsQuery,
  useRemoveAttachmentMutation,
} from "../redux/slices/api/taskApiSlice";

// Helper function to get appropriate icon based on file extension
const getFileIcon = (filename) => {
  if (!filename) return <FaFile size={24} className="text-gray-500" />;

  try {
    const extension = filename.split(".").pop().toLowerCase();

    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <FaImage size={24} className="text-blue-500" />;
      case "pdf":
        return <FaFilePdf size={24} className="text-red-500" />;
      case "doc":
      case "docx":
        return <FaFileWord size={24} className="text-blue-700" />;
      case "xls":
      case "xlsx":
        return <FaFileExcel size={24} className="text-green-600" />;
      case "txt":
        return <FaFileAlt size={24} className="text-gray-600" />;
      case "mp4":
      case "mov":
      case "avi":
      case "webm":
        return <FaPlay size={24} className="text-white" />;
      default:
        return <FaFile size={24} className="text-gray-500" />;
    }
  } catch (error) {
    console.error("Error getting file icon:", error);
    return <FaFile size={24} className="text-gray-500" />;
  }
};

// Check if an attachment is an image
const isImage = (filename) => {
  if (!filename) return false;
  try {
    const extension = filename.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "svg"].includes(extension);
  } catch (error) {
    console.error("Error checking if file is image:", error);
    return false;
  }
};

// Check if an attachment is a video
const isVideo = (filename) => {
  if (!filename) return false;
  try {
    const extension = filename.split(".").pop().toLowerCase();
    return ["mp4", "mov", "avi", "webm"].includes(extension);
  } catch (error) {
    console.error("Error checking if file is video:", error);
    return false;
  }
};

const Attachments = ({ taskId, isInTaskDetails = false, maxItems }) => {
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // RTK Query hooks
  const {
    data: attachmentsData,
    isLoading: fetchingAttachments,
    refetch: refetchAttachments,
  } = useGetAttachmentsQuery(taskId);

  const [addAttachment, { isLoading: uploading }] = useAddAttachmentMutation();
  const [removeAttachment, { isLoading: removing }] =
    useRemoveAttachmentMutation();

  const attachments = attachmentsData?.attachments || [];

  // Separate images from other attachments
  const imageAttachments = attachments.filter(
    (att) => att?.filename && isImage(att.filename)
  );
  const otherAttachments = attachments.filter(
    (att) => !att?.filename || !isImage(att.filename)
  );

  // If maxItems is provided, limit the number of attachments shown
  const displayImageAttachments = maxItems
    ? imageAttachments.slice(0, Math.ceil(maxItems / 2))
    : imageAttachments;

  const displayOtherAttachments = maxItems
    ? otherAttachments.slice(0, Math.floor(maxItems / 2))
    : otherAttachments;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      await addAttachment({
        id: taskId,
        attachment: file,
      }).unwrap();

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        toast.success("File uploaded successfully");
        refetchAttachments();
        setUploadProgress(0);
        setSelectedFile(null);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.data?.message || "Error uploading file");
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId, event) => {
    if (event) event.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      await removeAttachment(attachmentId).unwrap();
      toast.success("Attachment removed successfully");
      refetchAttachments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.data?.message || "Error removing attachment");
    }
  };

  // Format date to match the UI
  const formatDate = (date) => {
    return moment(date).format("DD MMM YYYY, hh:mm A");
  };

  return (
    <div className={`w-full ${isInTaskDetails ? "space-y-4" : ""}`}>
      {/* Only show the header if not in task details page or if explicitly needed in both places */}
      {!isInTaskDetails && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Attachments</h2>
            <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs text-gray-600">
              {attachments.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-gray-500 hover:text-gray-700"
              aria-label="Add attachment"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <FaPlus />
            </button>
          </div>
        </div>
      )}

      {/* Always show the upload button in task details page */}
      {isInTaskDetails && (
        <div className="flex justify-end">
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <FaPlus size={12} />
            <span>Add File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {!isInTaskDetails && (
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {isUploading && (
        <div className={`${isInTaskDetails ? "mb-3" : "mb-4"}`}>
          <p className="text-sm text-gray-600 mb-1">
            Uploading: {selectedFile.name}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {fetchingAttachments ? (
        <div className="flex justify-center py-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : attachments.length === 0 ? (
        <div
          className={`${
            isInTaskDetails ? "py-3" : "py-8"
          } text-center text-gray-500`}
        >
          <p>No attachments found for this task</p>
        </div>
      ) : (
        <div className={`${isInTaskDetails ? "space-y-4" : "space-y-6"}`}>
          {/* Image Attachments Section - Adapt column count for task details */}
          {displayImageAttachments.length > 0 && (
            <div>
              {!isInTaskDetails && (
                <h3 className="text-gray-600 uppercase text-sm font-medium mb-3">
                  ATTACHMENT IMAGES
                </h3>
              )}
              <div
                className={`grid grid-cols-1 ${
                  isInTaskDetails
                    ? "sm:grid-cols-2 md:grid-cols-2"
                    : "sm:gri d-cols-2 md:grid-cols-3 lg:grid-cols-4"
                } gap-3`}
              >
                {displayImageAttachments.map((attachment, index) => (
                  <div
                    key={`img-${attachment?._id || index}`}
                    className="relative bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="relative  w-full">
                      {attachment?.url ? (
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-100 flex items-center ">
                          {/* <FaImage size={32} className="text-black-400" /> */}
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-500 truncate max-w-full">
                        {attachment?.filename || `Image ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {attachment?.uploadedAt
                          ? formatDate(attachment.uploadedAt)
                          : "28 Feb 2023, 01:25 PM"}
                      </p>
                    </div>
                    {attachment?._id && (
                      <button
                        onClick={(e) =>
                          handleDeleteAttachment(attachment._id, e)
                        }
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Attachments Section - Grid Layout */}
          {displayOtherAttachments.length > 0 && (
            <div>
              <div
                className={`grid grid-cols-1 ${
                  isInTaskDetails
                    ? "sm:grid-cols-2 md:grid-cols-2"
                    : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                } gap-3`}
              >
                {displayOtherAttachments.map((attachment, index) => (
                  <div
                    key={attachment?._id || index}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                      {isVideo(attachment?.filename) && attachment?.url ? (
                        <div className="relative w-full h-full">
                          <video
                            className="w-full h-full object-contain"
                            poster={attachment.url}
                          >
                            <source src={attachment.url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 ${
                            isVideo(attachment?.filename)
                              ? "bg-gray-800"
                              : "bg-gray-200"
                          } rounded-full flex items-center justify-center`}
                        >
                          {getFileIcon(attachment?.filename)}
                        </div>
                      )}
                      {attachment?.url && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center ">
                          <img
                            src={attachment.url}
                            alt={attachment.filename}
                          ></img>
                          <a
                            href={attachment.url}
                            download={attachment.filename}
                            className="text-white opacity-0 group-hover:opacity-100 justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            zonez
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div className="max-w-[80%]">
                        <h3
                          className="font-medium text-sm truncate"
                          title={attachment?.filename}
                        >
                          {attachment?.filename || `File ${index + 1}`}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(attachment?.updatedAt || new Date())}
                        </p>
                      </div>
                      {attachment?._id && (
                        <button
                          onClick={(e) =>
                            handleDeleteAttachment(attachment._id, e)
                          }
                          disabled={removing}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* "View All" link when in task details and items are limited */}
          {isInTaskDetails && maxItems && attachments.length > maxItems && (
            <div className="text-center pt-2">
              <button className="text-blue-600 text-sm hover:underline">
                View all attachments ({attachments.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attachments;
