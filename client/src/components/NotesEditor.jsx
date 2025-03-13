import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  FaMarkdown,
  FaFileAudio,
  FaPlayCircle,
  FaPauseCircle,
  FaUpload,
} from "react-icons/fa";
import { MdEdit, MdPreview, MdDelete } from "react-icons/md";
import clsx from "clsx";

const NotesEditor = ({ initialNotes, onSave, onCancel, audioUrl }) => {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [audioFile, setAudioFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const audioPlayerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setCharacterCount(notes.length);
  }, [notes]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
      setUploadedFileName(file.name);
    } else {
      alert("Please select a valid audio file");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const togglePlayPause = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setUploadedFileName("");
    fileInputRef.current.value = "";
  };

  return (
    <div className="border rounded-md border-gray-300 overflow-hidden">
      {/* Editor Header */}
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setIsPreviewMode(false)}
            className={clsx(
              "px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1",
              !isPreviewMode
                ? "bg-white border border-gray-300 shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            )}
          >
            <MdEdit className="text-gray-600" />
            Edit
          </button>
          <button
            onClick={() => setIsPreviewMode(true)}
            className={clsx(
              "px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1",
              isPreviewMode
                ? "bg-white border border-gray-300 shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            )}
          >
            <MdPreview className="text-gray-600" />
            Preview
          </button>
        </div>
        <div>
          <span className="text-xs text-gray-500">
            {characterCount} characters
          </span>
        </div>
      </div>

      {/* Editor Content */}
      {isPreviewMode ? (
        <div className="p-4 min-h-[200px] bg-white prose prose-sm max-w-none">
          {typeof notes === "string" ? (
            <ReactMarkdown>{notes}</ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">No notes available</p>
          )}
        </div>
      ) : (
        <textarea
          className="w-full p-4 min-h-[200px] font-mono text-sm border-0 focus:ring-0 focus:outline-none resize-y"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your notes here using Markdown formatting..."
        ></textarea>
      )}

      {/* Audio Upload Section */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-300">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Audio Notes</div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md flex items-center gap-1 hover:bg-blue-700 transition-colors text-sm"
          >
            <FaUpload /> Upload Audio
          </button>

          {(audioFile || audioUrl) && (
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md">
              <button
                onClick={togglePlayPause}
                className="text-blue-600 hover:text-blue-800"
              >
                {isPlaying ? (
                  <FaPauseCircle size={18} />
                ) : (
                  <FaPlayCircle size={18} />
                )}
              </button>
              <span className="text-sm text-gray-700">
                {audioFile ? uploadedFileName : "Existing Audio Note"}
              </span>
              <button
                onClick={handleRemoveAudio}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <MdDelete size={18} />
              </button>
              <audio
                ref={audioPlayerRef}
                src={audioFile ? URL.createObjectURL(audioFile) : audioUrl}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Display Attached Notes */}
      {/* This section can be expanded to show a list of all existing notes */}

      {/* Editor Footer */}
      <div className="bg-gray-100 px-4 py-3 border-t border-gray-300 flex justify-between items-center">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <FaMarkdown className="text-gray-600" />
          <span>Markdown supported</span>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            onClick={() => {
              const saveData = { text: notes, audioFile };
              onSave(saveData);
            }}
          >
            Update Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesEditor;
