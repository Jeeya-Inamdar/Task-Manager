import React, { useState, useEffect, useMemo } from "react";
import { FaList } from "react-icons/fa";
import { MdGridView } from "react-icons/md";
import { useParams, useNavigate } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import {

  Check,
  Edit,
  MoreHorizontal,
  Flag,
  Paperclip,
  Calendar,
  Plus,
  Trash2,
  UserCircle,
} from "lucide-react";
import {
  useGetAllTasksQuery,
  useUpdateTaskMutation,
  useDeleteOrRestoreTaskMutation,
  useGetAllTasksQuery,
  useUpdateTaskMutation,

} from "../redux/slices/api/taskApiSlice";
import Loading from "../components/Loader";
import Title from "../components/Title";
import Button from "../components/Button";
import Tabs from "../components/Tabs";
import AddTask from "../components/task/AddTask";
import Table from "../components/task/Table";
import AddSubTask from "../components/task/AddSubTask";

// Tab configuration
const TABS = [
  { title: "Board View", icon: <MdGridView /> },
  { title: "List View", icon: <FaList /> },
];


// Color mapping for columns
const titleColorMap = {
  todo: "bg-blue-500 text-white",
  "in-progress": "bg-orange-500 text-white",
  completed: "bg-green-500 text-white",
};

// Display names for task stages
const stageDisplayNames = {
  todo: "TODO",
  "in progress": "IN PROGRESS",
  completed: "COMPLETE",
};


// Format tasks for display
const formatTasksForDisplay = (tasks) => {
  return tasks.map((task) => ({
    id: task.id,

    _id: task._id,

    _id: task._id, // Include _id for API calls

    title: task.title,
    stage: task.stage,
    isSelected: false,
    priority: task.priority,
    createdAt: task.createdAt,
    items: [
      task.assignedTo ? `@${task.assignedTo.split("@")[0]}` : "",
      ...(task.description ? [task.description] : []),
      ...(task.subtasks ? task.subtasks.map((st) => st.title) : []),
    ].filter(Boolean),
  }));
};

// Simple TaskCard component
const SimpleDraggableTaskCard = ({
  task,
  onDragStart,
  onEdit,
  onAddSubtask,
}) => {
  const navigate = useNavigate();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteOrRestoreTaskMutation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [dueDate, setDueDate] = useState(task.dueDate || "");

  const handleNavigate = () => {
    navigate(`/task/${task._id}`);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (confirmDelete) {
      await deleteTask({ id: task._id, actionType: "delete" });
    }
  };

  const handleDateChange = async (event) => {
    const newDate = event.target.value;
    setDueDate(newDate);
    await updateTask({ id: task._id, data: { dueDate: newDate } });
  };

  return (
    <div
      className="task-card bg-white p-3 rounded-md shadow border border-gray-200 cursor-pointer"
      draggable="true"
      onDragStart={(e) => onDragStart(e, task)}
      data-task-id={task._id}
      onClick={handleNavigate}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{task.title}</h3>
        <div className="flex gap-2">
          {/* Edit Task Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          >
            <Edit size={16} className="text-gray-500 hover:text-blue-500" />
          </button>

          {/* Add Subtask Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask(task);
            }}
          >
            <Plus size={16} className="text-gray-500 hover:text-blue-500" />
          </button>

          {/* Set Due Date */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCalendar(!showCalendar);
            }}
          >
            <Calendar size={16} className="text-gray-500 hover:text-blue-500" />
          </button>

          {/* Delete Task Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 size={16} className="text-red-500 hover:text-red-700" />
          </button>
        </div>
      </div>

      {/* Display Due Date Picker */}
      {showCalendar && (
        <input
          type="date"
          value={dueDate}
          onChange={handleDateChange}
          className="block mt-2 p-1 border border-gray-300 rounded-md text-sm"
        />
      )}

      {/* Display Assigned User Profile */}
      {task.assignedTo && (
        <div className="flex items-center mt-2 gap-2 text-sm text-gray-700">
          <UserCircle size={20} className="text-gray-500" />
          <span>{task.assignedTo}</span>
        </div>
      )}

      {/* Task Details */}
      {task.items.length > 0 && (
        <div className="text-sm text-gray-600 mt-2">
          {task.items.map((item, idx) => (
            <div key={idx} className="mb-1">
              {item}
            </div>
          ))}
        </div>
      )}

      {/* Display Task Priority */}
      <div className="mt-8 flex items-center gap-2">
        {task.priority && (
          <div
            className={`text-xs inline-block px-2 py-1 rounded ${
              task.priority === "high"
                ? "bg-red-100 text-red-800"
                : task.priority === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {task.priority}
          </div>
        )}

        {task.createdAt && (
          <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {new Date(task.createdAt).toDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

// New component for adding a stage
const AddStageForm = ({ onAddStage, onCancel }) => {
  const [stageName, setStageName] = useState("");
  const [color, setColor] = useState("blue");

  const colorOptions = [
    { name: "Blue", value: "blue", class: "bg-blue-500" },
    { name: "Orange", value: "orange", class: "bg-orange-500" },
    { name: "Green", value: "green", class: "bg-green-500" },
    { name: "Red", value: "red", class: "bg-red-500" },
    { name: "Purple", value: "purple", class: "bg-purple-500" },
    { name: "Teal", value: "teal", class: "bg-teal-500" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (stageName.trim()) {
      onAddStage({
        id: stageName.toLowerCase().replace(/\s+/g, "-"),
        name: stageName,
        color,
      });
      setStageName("");
      setColor("blue");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded-md shadow border border-gray-200"
    >
      <h3 className="font-bold text-lg mb-4">Add New Stage</h3>

      <div className="mb-4">
        <label htmlFor="stageName" className="block mb-1 font-medium">
          Stage Name
        </label>
        <input
          id="stageName"
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={stageName}
          onChange={(e) => setStageName(e.target.value)}
          placeholder="Enter stage name"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Color</label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-8 h-8 rounded-full ${option.class} ${
                color === option.value
                  ? "ring-2 ring-offset-2 ring-gray-500"
                  : ""
              }`}
              onClick={() => setColor(option.value)}
              title={option.name}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Stage
        </button>
      </div>
    </form>
  );
};

const Tasks = () => {
  const params = useParams();
  const navigate = useNavigate();



  const stage = params?.stage || "";


  // State
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [subTaskOpen, setSubTaskOpen] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState("");
  const [draggingTask, setDraggingTask] = useState(null);

  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Custom stages state
  const [stages, setStages] = useState([
    { id: "todo", name: "TODO", color: "blue" },
    { id: "in-progress", name: "IN PROGRESS", color: "orange" },
    { id: "completed", name: "COMPLETE", color: "green" },
  ]);
  const [showAddStageForm, setShowAddStageForm] = useState(false);

  const [dropTargetStage, setDropTargetStage] = useState(null);
  const [showDependencies, setShowDependencies] = useState(true);


  // API hooks
  const { data, isLoading, refetch } = useGetAllTasksQuery({
    stage: params.status,
    isTrashed: "",
    viewType: "",
  });

  const [updateTask] = useUpdateTaskMutation();

  // Memoized values
  const allTasks = useMemo(
    () => formatTasksForDisplay(data?.tasks || []),
    [data]
  );


  // Group tasks by stage
  const tasksByStage = useMemo(() => {
    const result = {};

    // Initialize with empty arrays for all stages
    stages.forEach((stage) => {
      result[stage.id.replace(/-/g, " ")] = [];
    });

    // Fill with tasks
    allTasks.forEach((task) => {
      const stageKey = task.stage.toLowerCase();
      if (result[stageKey]) {
        result[stageKey].push(task);
      } else {
        // If the stage doesn't exist in our stages list, add the task to the first stage
        const firstStageKey = stages[0]?.id.replace(/-/g, " ");
        if (firstStageKey && result[firstStageKey]) {
          result[firstStageKey].push({ ...task, stage: firstStageKey });
        }
      }
    });

    return result;
  }, [allTasks, stages]);

  // Add a helper logging function that was missing
  const logEvent = (name, e, data) => {
    console.log(`Event: ${name}`, { data, eventType: e.type });
  };



  // Filtered tasks
  const todoTasks = useMemo(
    () => allTasks.filter((task) => task.stage === "todo"),
    [allTasks]
  );
  const inProgressTasks = useMemo(
    () => allTasks.filter((task) => task.stage === "in progress"),
    [allTasks]
  );
  const completedTasks = useMemo(
    () => allTasks.filter((task) => task.stage === "completed"),
    [allTasks]
  );


  // Drag and drop handlers
  const onDragStart = (e, task) => {
    logEvent("onDragStart", e, task);

    e.dataTransfer.setData("text/plain", task._id);

    setIsDragging(true);
    setDraggingTask(task);


    setTimeout(() => {
      const element = document.querySelector(`[data-task-id="${task._id}"]`);
      if (element) {
        element.classList.add("opacity-50");
      }
    }, 0);

    if (e.target) {
      setTimeout(() => {
        e.target.classList.add("scale-105", "shadow-lg", "opacity-50");
      }, 0);
    }

  };

  const onDragEnd = (e) => {
    //logEvent("onDragEnd", e);
    setIsDragging(false);
    setDraggingTask(null);


    document.querySelectorAll(".task-card").forEach((card) => {
      card.classList.remove("opacity-50");
    });

    document.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.classList.remove("bg-blue-100", "border-blue-500");

    setDropTargetStage(null);

    if (e.target) {
      e.target.classList.remove("scale-105", "shadow-lg", "opacity-50");
    }

    // Remove highlighting
    document.querySelectorAll(".bg-blue-50").forEach((el) => {
      el.classList.remove("bg-blue-50", "border-blue-500");

    });
  };

  const onDragOver = (e, stage) => {
    e.preventDefault();

    // logEvent("onDragOver", e, stage);

    if (isDragging) {
      document.querySelectorAll(".drop-zone").forEach((zone) => {
        if (zone.getAttribute("data-stage") === stage) {
          zone.classList.add("bg-blue-100", "border-blue-500");
        } else {
          zone.classList.remove("bg-blue-100", "border-blue-500");
        }
      });
    }
  };

  const onDragLeave = (e) => {
    //logEvent("onDragLeave", e);

    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove("bg-blue-100", "border-blue-500");
    }
  };

  const onDrop = async (e, newStage) => {
    e.preventDefault();
    //logEvent("onDrop", e, newStage);

    const taskId = e.dataTransfer.getData("text/plain");
    console.log("Dropped task ID:", taskId);

    if (!taskId) {
      console.error("No task ID found in drop data");
      return;
    }

    const taskToUpdate = allTasks.find((task) => task._id === taskId);
    if (!taskToUpdate) {
      console.error("Task not found:", taskId);
      return;
    }

    if (taskToUpdate.stage === newStage) {
      console.log("Task dropped in the same stage, no update needed");
      return;
    }

    try {
      console.log(
        `Updating task ${taskId} from ${taskToUpdate.stage} to ${newStage}`
      );

      await updateTask({
        id: taskId,
        data: { stage: newStage },
      }).unwrap();

      console.log("Task updated successfully");

      refetch();
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsDragging(false);
      setDraggingTask(null);

      document.querySelectorAll(".drop-zone").forEach((zone) => {
        zone.classList.remove("bg-blue-100", "border-blue-500");
      });

    setDropTargetStage(stage);

    // Highlight drop target
    document.querySelectorAll("[data-stage]").forEach((el) => {
      if (el.dataset.stage === stage) {
        el.classList.add("bg-blue-50", "border-blue-500");
      } else {
        el.classList.remove("bg-blue-50", "border-blue-500");
      }
    });
  };

  const onDrop = async (e, newStage) => {
    e.preventDefault();

    const taskId = e.dataTransfer.getData("taskId");
    console.log("Dropped Task ID:", taskId);

    const taskToUpdate = allTasks.find((task) => task.id === taskId);
    if (!taskToUpdate) {
      console.error("Task not found!");
      return;
    }

    // Only update if stage changed
    if (taskToUpdate.stage !== newStage) {
      try {
        const result = await updateTask({
          id: taskToUpdate._id,
          data: { stage: newStage },
        }).unwrap();

        console.log(`Task ${taskId} moved to ${newStage}`);
        refetch();
      } catch (err) {
        console.error("Failed to update task:", err);
      }

    }
  };

  const handleAddTask = (status) => {
    setAddTaskStatus(status);
    setOpen(true);
  };


  const handleEditTask = (task) => {
    setEditingTask(task);
    setOpen(true);
  };

  const handleAddSubtask = (task) => {
    setSelectedTaskId(task._id);
    setSubTaskOpen(true);
  };

  const handleAddStage = (newStage) => {
    setStages([...stages, newStage]);
    setShowAddStageForm(false);

    // Store the updated stages in localStorage to persist them
    localStorage.setItem("taskStages", JSON.stringify([...stages, newStage]));
  };

  const handleRemoveStage = (stageId) => {
    // Don't allow removing if it's one of the last two stages
    if (stages.length <= 2) {
      alert("You must have at least two stages in your workflow.");
      return;
    }

    // Find all tasks in this stage
    const tasksInStage = allTasks.filter(
      (task) => task.stage === stageId.replace(/-/g, " ")
    );

    // If there are tasks, confirm deletion and determine where to move them
    if (tasksInStage.length > 0) {
      const confirmDelete = window.confirm(
        `This stage contains ${tasksInStage.length} tasks. Removing it will move all tasks to the first stage. Continue?`
      );

      if (!confirmDelete) return;

      // Move tasks to the first available stage (that's not being deleted)
      const targetStage =
        stages.find((s) => s.id !== stageId)?.id.replace(/-/g, " ") || "todo";

      // Update all tasks in this stage
      Promise.all(
        tasksInStage.map((task) =>
          updateTask({
            id: task._id,
            data: { stage: targetStage },
          }).unwrap()
        )
      )
        .then(() => {
          console.log(`Moved ${tasksInStage.length} tasks to ${targetStage}`);
          refetch();
        })
        .catch((error) => {
          console.error("Failed to move tasks:", error);
        });
    }

    // Remove the stage
    const updatedStages = stages.filter((stage) => stage.id !== stageId);
    setStages(updatedStages);

    // Store the updated stages in localStorage
    localStorage.setItem("taskStages", JSON.stringify(updatedStages));
  };

  // Load saved stages on component mount
  useEffect(() => {
    const savedStages = localStorage.getItem("taskStages");
    if (savedStages) {
      try {
        setStages(JSON.parse(savedStages));
      } catch (error) {
        console.error("Failed to parse saved stages:", error);
      }
    }
  }, []);

  // Event listener setup and cleanup
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragging(false);
      setDraggingTask(null);

      document.querySelectorAll(".task-card").forEach((card) => {
        card.classList.remove("opacity-50");
      });

      document.querySelectorAll(".drop-zone").forEach((zone) => {
        zone.classList.remove("bg-blue-100", "border-blue-500");
      });
    };

    document.addEventListener("dragend", handleGlobalDragEnd);

    return () => {
      document.removeEventListener("dragend", handleGlobalDragEnd);

  // Event listener cleanup
  useEffect(() => {
    document.addEventListener("dragend", onDragEnd);
    return () => {
      document.removeEventListener("dragend", onDragEnd);

    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-10">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Title title={params.status ? `${params.status} Tasks` : "Tasks"} />
        <div className="flex gap-2">
          <Button
            onClick={() => handleAddTask("todo")}
            label="Add Task"
            icon={<IoMdAdd className="text-lg" />}
            className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md py-2 px-3"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-4 flex items-center gap-4">
        <button
          className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
          onClick={() => navigate(-1)}
        >
          Undo
        </button>
        <button
          className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
          onClick={() => navigate(1)}
        >
          Redo
        </button>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} setSelected={setSelected}>
        {selected === 0 ? (

          <div>
            {/* Board view with stages */}
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Workflow Stages</h2>
              {!showAddStageForm && (
                <button
                  onClick={() => setShowAddStageForm(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>Add Stage</span>
                </button>
              )}
            </div>

            {showAddStageForm && (
              <div className="mb-6">
                <AddStageForm
                  onAddStage={handleAddStage}
                  onCancel={() => setShowAddStageForm(false)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stages.map((stage) => {
                const stageKey = stage.id.replace(/-/g, " ");
                const stageTasks = tasksByStage[stageKey] || [];
                const colorClass = `bg-${stage.color}-500 text-white`;

                return (
                  <div key={stage.id} className="flex-1 flex flex-col">
                    <div
                      className={`${colorClass} rounded-t-lg px-4 py-2 flex justify-between items-center`}
                    >
                      <h2 className="text-lg font-bold">{stage.name}</h2>
                      <div className="flex items-center gap-2">
                        <span className="bg-white text-blue-500 rounded-full px-2 py-0.5 text-sm font-bold">
                          {stageTasks.length}
                        </span>
                        {stages.length > 2 && (
                          <button
                            onClick={() => handleRemoveStage(stage.id)}
                            className="text-white hover:text-red-200"
                            title="Remove Stage"
                          >
                            <Trash2 size={16} />
                          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TODO Column */}
            <div className="flex-1 flex flex-col">
              <div
                className={`${titleColorMap["todo"]} rounded-t-lg px-4 py-2 flex justify-between items-center`}
              >
                <h2 className="text-lg font-bold">
                  {stageDisplayNames["todo"]}
                </h2>
                <span className="bg-white text-blue-500 rounded-full px-2 py-0.5 text-sm font-bold">
                  {todoTasks.length}
                </span>
              </div>
              <div
                data-stage="todo"
                className="flex-1 min-h-64 border-2 border-gray-200 rounded-b-lg p-3 bg-gray-50 transition-all duration-200"
                onDrop={(e) => onDrop(e, "todo")}
                onDragOver={(e) => onDragOver(e, "todo")}
              >
                {todoTasks.length > 0 ? (
                  <div className="space-y-3">
                    {todoTasks.map((task) => (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        className="bg-white p-3 rounded-md border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-grab"
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                      >
                        <h3 className="font-medium truncate">{task.title}</h3>
                        {task.items.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            {task.items.map((item, i) => (
                              <div key={i} className="truncate">
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 italic">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>

            {/* IN PROGRESS Column */}
            <div className="flex-1 flex flex-col">
              <div
                className={`${titleColorMap["in-progress"]} rounded-t-lg px-4 py-2 flex justify-between items-center`}
              >
                <h2 className="text-lg font-bold">
                  {stageDisplayNames["in progress"]}
                </h2>
                <span className="bg-white text-orange-500 rounded-full px-2 py-0.5 text-sm font-bold">
                  {inProgressTasks.length}
                </span>
              </div>
              <div
                data-stage="in progress"
                className="flex-1 min-h-64 border-2 border-gray-200 rounded-b-lg p-3 bg-gray-50 transition-all duration-200"
                onDrop={(e) => onDrop(e, "in progress")}
                onDragOver={(e) => onDragOver(e, "in progress")}
              >
                {inProgressTasks.length > 0 ? (
                  <div className="space-y-3">
                    {inProgressTasks.map((task) => (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        className="bg-white p-3 rounded-md border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-grab"
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                      >
                        <h3 className="font-medium truncate">{task.title}</h3>
                        {task.items.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            {task.items.map((item, i) => (
                              <div key={i} className="truncate">
                                {item}
                              </div>
                            ))}
                          </div>

                        )}
                      </div>
                    </div>
                    <div
                      data-stage={stageKey}
                      className="drop-zone flex-1 min-h-64 border-2 border-gray-200 rounded-b-lg p-3 bg-gray-50 transition-all duration-200"
                      onDragOver={(e) => onDragOver(e, stageKey)}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => onDrop(e, stageKey)}
                    >
                      {stageTasks.length > 0 ? (
                        <div className="space-y-3">
                          {stageTasks.map((task) => (
                            <SimpleDraggableTaskCard
                              key={task._id}
                              task={task}
                              onDragStart={onDragStart}
                              onEdit={handleEditTask}
                              onAddSubtask={handleAddSubtask}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <button
                            onClick={() => handleAddTask(stageKey)}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 bg-white p-3 rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-all"
                          >
                            <Plus size={18} />
                            <span>Add Task</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                );
              })}

                )}
              </div>
            </div>

            {/* COMPLETED Column */}
            <div className="flex-1 flex flex-col">
              <div
                className={`${titleColorMap["completed"]} rounded-t-lg px-4 py-2 flex justify-between items-center`}
              >
                <h2 className="text-lg font-bold">
                  {stageDisplayNames["completed"]}
                </h2>
                <span className="bg-white text-green-500 rounded-full px-2 py-0.5 text-sm font-bold">
                  {completedTasks.length}
                </span>
              </div>
              <div
                data-stage="completed"
                className="flex-1 min-h-64 border-2 border-gray-200 rounded-b-lg p-3 bg-gray-50 transition-all duration-200"
                onDrop={(e) => onDrop(e, "completed")}
                onDragOver={(e) => onDragOver(e, "completed")}
              >
                {completedTasks.length > 0 ? (
                  <div className="space-y-3">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        className="bg-white p-3 rounded-md border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-grab"
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                      >
                        <h3 className="font-medium truncate">{task.title}</h3>
                        {task.items.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            {task.items.map((item, i) => (
                              <div key={i} className="truncate">
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 italic">Drop tasks here</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <Table tasks={data?.tasks} />
        )}
      </Tabs>


      {/* Add/Edit Task modal */}

      {/* Add Task modal */}

      <AddTask
        open={open}
        setOpen={setOpen}
        initialStatus={addTaskStatus}

        task={editingTask}
        // Pass available stages to the task form
        availableStages={stages.map((s) => ({
          value: s.id.replace(/-/g, " "),
          label: s.name,
        }))}
        onSuccess={() => {
          setOpen(false);
          setEditingTask(null);

        onSuccess={() => {
          setOpen(false);

          refetch();
        }}
      />


      {/* AddSubTask modal */}
      <AddSubTask
        open={subTaskOpen}
        setOpen={setSubTaskOpen}
        id={selectedTaskId}
        onSuccess={() => {
          setSubTaskOpen(false);
          setSelectedTaskId(null);
          refetch();
        }}
      />

      {/* Dependencies visualization (placeholder) */}
      {showDependencies && <div className="relative"></div>}

    </div>
  );
};

export default Tasks;
