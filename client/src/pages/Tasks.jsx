import React, { useState, useEffect, useMemo } from "react";
import { FaList } from "react-icons/fa";
import { MdGridView } from "react-icons/md";
import { useParams, useNavigate } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import {
  useGetAllTasksQuery,
  useUpdateTaskMutation,
} from "../redux/slices/api/taskApiSlice";
import Loading from "../components/Loader";
import Title from "../components/Title";
import Button from "../components/Button";
import Tabs from "../components/Tabs";
import AddTask from "../components/task/AddTask";
import Table from "../components/task/Table";
import BoardView from "../components/BoardView";

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
    _id: task._id, // Include _id for API calls
    title: task.title,
    stage: task.stage,
    isSelected: false,
    items: [
      task.assignedTo ? `@${task.assignedTo.split("@")[0]}` : "",
      ...(task.description ? [task.description] : []),
      ...(task.subtasks ? task.subtasks.map((st) => st.title) : []),
    ].filter(Boolean),
  }));
};

const Tasks = () => {
  const params = useParams();
  const navigate = useNavigate();

  const stage = params?.stage || "";

  // State
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState("");
  const [draggingTask, setDraggingTask] = useState(null);
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
    e.dataTransfer.setData("taskId", task.id);
    setDraggingTask(task);

    if (e.target) {
      setTimeout(() => {
        e.target.classList.add("scale-105", "shadow-lg", "opacity-50");
      }, 0);
    }
  };

  const onDragEnd = (e) => {
    setDraggingTask(null);
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
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 italic">Drop tasks here</p>
                  </div>
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

      {/* Add Task modal */}
      <AddTask
        open={open}
        setOpen={setOpen}
        initialStatus={addTaskStatus}
        onSuccess={() => {
          setOpen(false);
          refetch();
        }}
      />

      {/* Dependencies visualization (placeholder) */}
      {showDependencies && <div className="relative"></div>}
    </div>
  );
};

export default Tasks;
