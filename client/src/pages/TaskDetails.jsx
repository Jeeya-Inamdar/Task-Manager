import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import { toast } from "sonner";
import moment from "moment";
import {
  FaTasks,
  FaPaperclip,
  FaThumbsUp,
  FaUser,
  FaBug,
  FaRegClock,
  FaHistory,
  FaComments,
} from "react-icons/fa";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
  MdTaskAlt,
  MdEdit,
  MdOutlineDoneAll,
  MdOutlineMessage,
  MdDelete,
} from "react-icons/md";
import { RxActivityLog } from "react-icons/rx";
import { GrInProgress } from "react-icons/gr";

import {
  useGetTaskByIdQuery,
  useGetAttachmentsQuery,
  useUpdateTaskMutation,
  usePostTaskActivityMutation,
  useAddVoiceNotesMutation,
  useDeleteNotesMutation,
  useGetNotesByTaskIdQuery,
} from "../redux/slices/api/taskApiSlice";
import {
  PRIORITYSTYLES,
  TASK_TYPE,
  getInitials,
  dateFormatter,
} from "../utils";
import Loading from "../components/Loader";
import Button from "../components/Button";
import NotesEditor from "../components/NotesEditor";
import Attachments from "../components/Attachments";
import Activities from "../components/Activities"; // Import the Activities component

// Icons for priority
const ICONS = {
  high: <MdKeyboardDoubleArrowUp className="text-red-600" />,
  medium: <MdKeyboardArrowUp className="text-yellow-600" />,
  low: <MdKeyboardArrowDown className="text-blue-600" />,
};

// Background colors for priority
const bgColor = {
  high: "bg-red-100",
  medium: "bg-yellow-100",
  low: "bg-blue-100",
};

// Text colors for priority
const textColor = {
  high: "text-red-700",
  medium: "text-yellow-700",
  low: "text-blue-700",
};

// Icons for activity types
const TASKTYPEICON = {
  commented: (
    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white">
      <MdOutlineMessage size={20} />
    </div>
  ),
  started: (
    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
      <FaThumbsUp size={20} />
    </div>
  ),
  assigned: (
    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white">
      <FaUser size={20} />
    </div>
  ),
  bug: (
    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white">
      <FaBug size={20} />
    </div>
  ),
  completed: (
    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
      <MdOutlineDoneAll size={20} />
    </div>
  ),
  "in progress": (
    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white">
      <GrInProgress size={20} className="text-white" />
    </div>
  ),
};

const TaskDetails = () => {
  const { id } = useParams();
  const { data, isLoading, refetch } = useGetTaskByIdQuery(id);
  const { data: attachmentsData } = useGetAttachmentsQuery(id);
  const [updateTask] = useUpdateTaskMutation();
  const [addVoiceNotes] = useAddVoiceNotesMutation();
  const [deleteNotes] = useDeleteNotesMutation();
  const { data: notesData, refetch: refetchNotes } =
    useGetNotesByTaskIdQuery(id);
  const [postActivity, { isLoading: activityLoading }] =
    usePostTaskActivityMutation();

  // State
  const [selected, setSelected] = useState(0); // For main tabs
  const [activeTab, setActiveTab] = useState("all"); // For activity tabs
  const [isEditing, setIsEditing] = useState(false);
  const [activityText, setActivityText] = useState("");
  const [selectedActivityType, setSelectedActivityType] = useState("Started");

  const task = data?.task;
  const [notes, setNotes] = useState(task?.notes || "");
  console.log(notesData?.notes);

  // Activity types
  const activityTypes = [
    "Started",
    "Completed",
    "In Progress",
    "Commented",
    "Bug",
    "Assigned",
  ];

  // Main tabs with counts
  const TABS = [
    { title: "Task Detail", icon: <FaTasks className="text-blue-600" /> },
    {
      title: "Activities/Timeline",
      icon: <RxActivityLog className="text-blue-600" />,
    },
    // {
    //   title: "Attachments",
    //   icon: <FaPaperclip className="text-blue-600" />,
    //   badge: attachmentsData?.attachments?.length || 0,
    // },
  ];

  // Update notes when task data changes
  useEffect(() => {
    if (task) {
      setNotes(task.notes || "");
    }
  }, [task]);

  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // const handleSaveNotes = async (updatedText) => {
  //   console.log(updatedText);
  //   try {
  //     await updateTask({
  //       id,
  //       data: { notes: { ...task?.notes, text: updatedText } },
  //     }).unwrap();

  //     setIsEditing(false);
  //     refetch();
  //     toast.success("Notes updated successfully");
  //   } catch (error) {
  //     console.error("Failed to update notes:", error);
  //     toast.error("Failed to update notes");
  //   }
  // };
  const handleSaveNotes = async (updatedData) => {
    try {
      // Handle text notes update
      if (updatedData.text !== task?.notes?.text) {
        await updateTask({
          id,
          data: { notes: { ...task?.notes, text: updatedData.text } },
        }).unwrap();
      }

      // Handle audio notes if present
      if (updatedData.audioBlob) {
        const formData = new FormData();
        formData.append("audioNote", updatedData.audioBlob, "voice-note.wav");

        await addVoiceNotes({
          id,
          notes: formData,
        }).unwrap();
      }

      setIsEditing(false);
      refetch();
      refetchNotes();
      toast.success("Notes updated successfully");
    } catch (error) {
      console.error("Failed to update notes:", error);
      toast.error("Failed to update notes");
    }
  };

  const handleDeleteNotes = async () => {
    try {
      await deleteNotes(id).unwrap();
      toast.success("Notes deleted successfully");
      refetch();
      refetchNotes();
    } catch (error) {
      console.error("Failed to delete notes:", error);
      toast.error("Failed to delete notes");
    }
  };

  const handleActivitySubmit = async () => {
    if (!activityText.trim()) {
      toast.error("Activity text cannot be empty");
      return;
    }

    try {
      const activityData = {
        type: selectedActivityType.toLowerCase(),
        activity: activityText,
      };
      const result = await postActivity({ data: activityData, id }).unwrap();

      setActivityText("");
      toast.success(result?.message || "Activity added successfully");
      refetch();
    } catch (error) {
      console.error("Error posting activity:", error);
      toast.error(
        error?.data?.message || error.error || "Failed to add activity"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-3xl text-gray-500 mb-4">No task found</div>
        <p className="text-gray-500">
          The task may have been deleted or you don't have access to it.
        </p>
      </div>
    );
  }

  // Activity Card Component
  const ActivityCard = ({ item }) => {
    return (
      <div className="flex space-x-4">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-10 h-10 flex items-center justify-center">
            {TASKTYPEICON[item?.type]}
          </div>
          <div className="w-full flex items-center">
            <div className="w-0.5 bg-gray-300 h-full"></div>
          </div>
        </div>

        <div className="flex flex-col gap-y-1 mb-8 w-full">
          <div className="flex justify-between items-start">
            <p className="font-semibold">{item?.by?.name}</p>
            <span className="text-sm text-gray-500">
              {moment(item?.date).fromNow()}
            </span>
          </div>
          <div className="text-gray-500 flex items-center space-x-2">
            <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100">
              {item?.type}
            </span>
          </div>
          <div className="text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-400">
            {item?.activity}
          </div>
        </div>
      </div>
    );
  };

  // Empty state for activities
  const EmptyState = ({ type }) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <RxActivityLog size={48} className="mb-4 text-gray-300" />
      <p className="text-lg font-medium">No {type} found</p>
      <p className="text-sm mt-1">
        Activities will appear here once they're added
      </p>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-4 mb-4 overflow-y-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b">
        <h1 className="text-2xl text-gray-700 font-bold">{task?.title}</h1>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <div
            className={clsx(
              "flex gap-1 items-center text-sm font-semibold px-3 py-1.5 rounded-full",
              bgColor[task?.priority],
              textColor[task?.priority]
            )}
          >
            <span className="text-lg">{ICONS[task?.priority]}</span>
            <span className="uppercase">{task?.priority} Priority</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
            <div
              className={clsx("w-3 h-3 rounded-full", TASK_TYPE[task?.stage])}
            />
            <span className="text-black uppercase text-sm">{task?.stage}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {TABS.map((tab, index) => (
          <div
            key={index}
            className={clsx(
              "px-4 py-3 cursor-pointer flex items-center gap-2 whitespace-nowrap",
              selected === index
                ? "border-b-2 border-blue-700 text-blue-600 font-medium"
                : "text-gray-600 hover:text-blue-500"
            )}
            onClick={() => setSelected(index)}
          >
            <span>{tab.icon}</span>
            <span>{tab.title}</span>
            {tab.badge > 0 && (
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-600">
                {tab.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Content based on selected tab */}
      {selected === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 bg-white shadow-sm rounded-lg p-6 overflow-y-auto">
          {/* LEFT SIDE - Task Details */}
          <div className="md:col-span-3 space-y-8">
            {/* Task metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-300 bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Created</div>
                <div className="flex items-center space-x-2">
                  <FaRegClock className="text-gray-400" />
                  <span>{dateFormatter(task?.createdAt)}</span>
                </div>
              </div>

              <div className="border border-gray-300 bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Assigned To</div>
                <div className="flex items-center space-x-2">
                  {task?.team && task.team[0] && (
                    <>
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                        {getInitials(task.team[0].name)}
                      </div>
                      <span>{task.team[0].name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4 bg-white p-5 rounded-lg border border-gray-300">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg flex items-center">
                  <MdOutlineMessage className="mr-2 text-blue-600" /> Notes
                </h2>
                <div className="flex gap-2">
                  {!isEditing && task?.notes && (
                    <button
                      className="text-red-600 hover:text-red-800 flex items-center gap-1 px-3 py-1 bg-red-50 rounded-md"
                      onClick={handleDeleteNotes}
                    >
                      <MdDelete /> Delete
                    </button>
                  )}
                  {!isEditing && (
                    <button
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-md"
                      onClick={handleEdit}
                    >
                      <MdEdit /> Edit
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <NotesEditor
                  initialNotes={notesData?.text || ""}
                  audioUrl={notesData?.voiceNote?.url}
                  onSave={handleSaveNotes}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-md prose prose-sm max-w-none bg-gray-50">
                    {notesData?.notes?.text ? (
                      <ReactMarkdown>{notesData?.notes?.text}</ReactMarkdown>
                    ) : (
                      <p className="text-gray-400 italic">
                        No notes available. Click Edit to add notes.
                      </p>
                    )}
                  </div>

                  {notesData?.notes?.voiceNote && (
                    <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-md">
                      <audio
                        controls
                        src={notesData?.notes?.voiceNote?.url}
                        className="w-full max-w-md"
                      />
                      <div className="text-xs text-gray-500">
                        {notesData?.audio?.createdAt &&
                          new Date(notesData.audio.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Sub-Tasks */}
            <div className="space-y-4 bg-white p-5 rounded-lg border border-gray-300">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg flex items-center">
                  <MdTaskAlt className="mr-2 text-violet-600" /> Sub-Tasks
                  <span className="ml-2 bg-violet-100 px-2 py-0.5 rounded-full text-xs text-violet-700">
                    {task?.subTasks?.length || 0}
                  </span>
                </h2>
              </div>

              {task?.subTasks && task.subTasks.length > 0 ? (
                <div className="space-y-4">
                  {task.subTasks.map((el, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-violet-50 flex-shrink-0">
                        <MdTaskAlt className="text-violet-600" size={24} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-sm text-gray-500">
                            {new Date(el?.date).toDateString()}
                          </span>

                          <span className="px-2 py-0.5 text-center text-sm rounded-full bg-violet-100 text-violet-700 font-medium">
                            {el?.tag}
                          </span>
                        </div>

                        <p className="text-gray-700 font-medium">{el?.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p>No sub-tasks available</p>
                </div>
              )}
            </div>

            {/* Attachments Preview */}

            <Attachments taskId={id}></Attachments>
          </div>

          {/* RIGHT SIDE - Activities */}
          <div className="md:col-span-2 space-y-6">
            {/* Task Team */}
            <div className="bg-white p-5 rounded-lg border border-gray-300">
              <h2 className="font-semibold text-lg mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-600" /> Task Team
              </h2>

              {task?.team && task.team.length > 0 ? (
                <div className="space-y-3">
                  {task.team.map((m, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-3 bg-gray-50 rounded-lg items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm flex-shrink-0">
                        {getInitials(m?.name)}
                      </div>

                      <div>
                        <p className="font-medium">{m?.name}</p>
                        <span className="text-gray-500 text-sm">
                          {m?.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <p>No team members assigned</p>
                </div>
              )}
            </div>

            {/* Activity Stream */}
            <div className="bg-white p-5 rounded-lg border border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg flex items-center">
                  <RxActivityLog className="mr-2 text-blue-600" /> Recent
                  Activity
                </h2>
                {task?.activities?.length > 3 && (
                  <button
                    className="text-blue-600 text-sm"
                    onClick={() => setSelected(1)}
                  >
                    View all
                  </button>
                )}
              </div>

              {/* Activity Navigation Tabs */}
              <div className="border-b mb-4">
                <div className="flex space-x-1">
                  <button
                    className={clsx(
                      "px-3 py-2 text-sm font-medium",
                      activeTab === "all"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-600"
                    )}
                    onClick={() => setActiveTab("all")}
                  >
                    All
                  </button>
                  <button
                    className={clsx(
                      "px-3 py-2 text-sm font-medium flex items-center",
                      activeTab === "comments"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-600"
                    )}
                    onClick={() => setActiveTab("comments")}
                  >
                    <FaComments className="mr-1" size={14} /> Comments
                  </button>
                  <button
                    className={clsx(
                      "px-3 py-2 text-sm font-medium flex items-center",
                      activeTab === "history"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-600"
                    )}
                    onClick={() => setActiveTab("history")}
                  >
                    <FaHistory className="mr-1" size={14} /> History
                  </button>
                </div>
              </div>

              {/* Activity Content */}
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {activeTab === "all" && task?.activities?.length > 0 ? (
                  task.activities
                    .slice(0, 3)
                    .map((el, index) => <ActivityCard key={index} item={el} />)
                ) : activeTab === "comments" &&
                  task?.activities?.filter((act) => act.type === "commented")
                    .length > 0 ? (
                  task.activities
                    .filter((act) => act.type === "commented")
                    .slice(0, 3)
                    .map((el, index) => <ActivityCard key={index} item={el} />)
                ) : activeTab === "history" &&
                  task?.activities?.filter((act) => act.type !== "commented")
                    .length > 0 ? (
                  task.activities
                    .filter((act) => act.type !== "commented")
                    .slice(0, 3)
                    .map((el, index) => <ActivityCard key={index} item={el} />)
                ) : (
                  <EmptyState
                    type={activeTab === "all" ? "activities" : activeTab}
                  />
                )}
              </div>
            </div>

            {/* Add Activity Form */}
            <div className="bg-white p-5 rounded-lg border border-gray-300">
              <h2 className="font-semibold text-lg mb-4 flex items-center">
                <MdOutlineMessage className="mr-2 text-blue-600" /> Add Activity
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activityTypes.map((item) => (
                    <div
                      key={item}
                      className={clsx(
                        "flex items-center space-x-2 p-2 rounded-md cursor-pointer border",
                        selectedActivityType === item
                          ? "bg-blue-50 border-blue-200"
                          : "border-gray-200"
                      )}
                      onClick={() => setSelectedActivityType(item)}
                    >
                      <input
                        type="radio"
                        id={`activity-${item}`}
                        checked={selectedActivityType === item}
                        onChange={() => setSelectedActivityType(item)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label
                        htmlFor={`activity-${item}`}
                        className="cursor-pointer text-sm"
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  placeholder="Add your activity details here..."
                  className="w-full mt-2 border border-gray-300 outline-none p-4 rounded-md focus:ring-2 ring-blue-300 resize-none"
                ></textarea>

                <Button
                  type="button"
                  label={activityLoading ? "Submitting..." : "Submit Activity"}
                  onClick={handleActivitySubmit}
                  disabled={activityLoading || !activityText.trim()}
                  className={clsx(
                    "w-full py-2.5 rounded-md font-medium transition-colors",
                    activityLoading || !activityText.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities/Timeline Tab Content */}
      {selected === 1 && (
        <Activities
          activity={task?.activities || []}
          id={id}
          refetch={refetch}
        />
      )}

      {/* Attachments Tab Content */}
      {selected === 2 && (
        <Attachments
          taskId={id}
          attachments={attachmentsData?.attachments || []}
        />
      )}
    </div>
  );
};

export default TaskDetails;
