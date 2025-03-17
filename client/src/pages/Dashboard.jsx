import React, { useState } from "react";
import {
  MdAdminPanelSettings,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
  MdOutlineTune,
  MdSearch,
  MdMoreVert,
} from "react-icons/md";
import { LuClipboardPen } from "react-icons/lu";
import { FaNewspaper, FaUsers, FaStar, FaRegBell } from "react-icons/fa";
import {
  FaArrowsToDot,
  FaLocationDot,
  FaCalendarCheck,
  FaPersonCircleCheck,
} from "react-icons/fa6";
import { BsFlagFill, BsThreeDotsVertical } from "react-icons/bs";
import moment from "moment";
import { summary } from "../assets/data";
import clsx from "clsx";
import { Chart } from "../components/Chart";
import { BGS, PRIORITYSTYLES, TASK_TYPE, getInitials } from "../utils";
import UserInfo from "../components/UserInfo";
import { useGetDashboardStatsQuery } from "../redux/slices/api/taskApiSlice";
import Loading from "../components/Loader";

//* Flagged Tasks Dialog Component
const FlaggedTasksDialog = ({ isOpen, onClose, flaggedTasks }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl transform transition-all">
        <div className="flex justify-between items-center p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <BsFlagFill className="text-red-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Flagged Tasks
              </h2>
              <p className="text-gray-500 text-sm">
                Highest priority items that need attention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MdKeyboardArrowDown className="text-2xl text-gray-500" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {flaggedTasks.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-red-50 inline-flex p-4 rounded-full mb-4">
                <BsFlagFill className="text-red-300 text-3xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No flagged tasks
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                When you flag important tasks, they will appear here for quick
                access
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {flaggedTasks.map((task, index) => (
                <li
                  key={index}
                  className="py-4 hover:bg-gray-50 px-3 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        "w-3 h-3 mt-1.5 rounded-full flex-shrink-0",
                        TASK_TYPE[task.stage]
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-900">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          <BsFlagFill className="text-red-500" />
                          <span>Flagged</span>
                        </div>
                      </div>

                      {task.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          {task.notes}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <div
                          className={clsx(
                            "px-2 py-1 rounded-full",
                            task.priority === "high"
                              ? "bg-red-50 text-red-600"
                              : task.priority === "medium"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-green-50 text-green-600"
                          )}
                        >
                          <span className="capitalize">
                            {task.priority} priority
                          </span>
                        </div>

                        {task.remindOnDate && (
                          <div className="flex items-center gap-1">
                            <FaCalendarCheck className="text-blue-500" />
                            <span>
                              {moment(task.remindOnDate).format("MMM DD")}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <span>Created {moment(task.date).fromNow()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
            Manage Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

//* TASK TABLE COMPONENT
const TaskTable = ({ tasks }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [flaggedTasks, setFlaggedTasks] = useState([]);

  // Handler for flag button click
  const handleFlagButtonClick = () => {
    const filtered = tasks.filter((task) => task.flagged);
    setFlaggedTasks(filtered);
    setIsDialogOpen(true);
  };

  // Handler for individual flag icon click
  const handleTaskFlagClick = (task) => {
    setFlaggedTasks([task]);
    setIsDialogOpen(true);
  };

  // Priority icons mapping
  const ICONS = {
    high: <MdKeyboardDoubleArrowUp />,
    medium: <MdKeyboardArrowUp />,
    low: <MdKeyboardArrowDown />,
  };

  //*RECENT TASK CARD
  const TableHeader = () => (
    <thead className="border-b border-gray-200">
      <tr className="text-gray-600 text-left text-sm">
        <th className="py-3 px-3 font-medium">Task Title</th>
        <th className="py-3 px-3 font-medium">Priority</th>
        <th className="py-3 px-3 font-medium">Team</th>
        <th className="py-3 px-3 font-medium hidden md:table-cell">Created</th>
      </tr>
    </thead>
  );

  const TableRow = ({ task }) => (
    <tr className="border-b border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <div
            className={clsx("w-3 h-3 rounded-full", TASK_TYPE[task.stage])}
          />
          <p className="text-gray-800 font-medium">{task.title}</p>
        </div>
      </td>

      <td className="py-3 px-3">
        <div
          className={clsx(
            "flex gap-1 items-center text-sm px-2 py-1 rounded-full w-fit",
            task.priority === "high"
              ? "bg-red-50 text-red-600"
              : task.priority === "medium"
              ? "bg-orange-50 text-orange-600"
              : "bg-green-50 text-green-600"
          )}
        >
          <span className="text-base">{ICONS[task.priority]}</span>
          <span className="capitalize">{task.priority}</span>
        </div>
      </td>

      <td className="py-3 px-3">
        <div className="flex">
          {task.team.map((m, index) => (
            <div
              key={index}
              className={clsx(
                "w-8 h-8 rounded-full text-white flex items-center justify-center text-sm -mr-2 border-2 border-white",
                BGS[index % BGS.length]
              )}
            >
              <UserInfo user={m} />
            </div>
          ))}
        </div>
      </td>

      <td className="py-3 px-3 text-sm text-gray-500 hidden md:table-cell">
        {moment(task?.date).fromNow()}
      </td>

      <td className="py-3 px-3 hidden lg:table-cell">
        <div className="flex gap-2">
          {task.flagged && (
            <div
              className="text-red-500 bg-red-50 p-1.5 rounded-md cursor-pointer hover:bg-red-100 transition-colors"
              title="Flagged as important"
              onClick={() => handleTaskFlagClick(task)}
            >
              <BsFlagFill />
            </div>
          )}
          {task.remindOnDate && (
            <div
              className="text-blue-500 bg-blue-50 p-1.5 rounded-md"
              title={`Reminder: ${moment(task.remindOnDate).format(
                "MMM DD"
              )} at ${task.remindOnTime || "9:00 AM"}`}
            >
              <FaCalendarCheck />
            </div>
          )}
          {task.atLocation && (
            <div
              className="text-green-500 bg-green-50 p-1.5 rounded-md"
              title={`Location: ${task.atLocation}`}
            >
              <FaLocationDot />
            </div>
          )}
          {task.meetingPerson && (
            <div
              className="text-purple-500 bg-purple-50 p-1.5 rounded-md"
              title={`Meeting: ${task.meetingPerson}`}
            >
              <FaPersonCircleCheck />
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <div className="w-full md:w-2/3 bg-white px-4 py-5 shadow-sm rounded-xl border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-gray-800">Recent Tasks</h3>
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MdSearch className="absolute left-3 top-2.5 text-gray-400 text-lg" />
            </div>
            <button className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <MdOutlineTune className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader />
            <tbody>
              {tasks?.map((task, id) => (
                <TableRow key={id} task={task} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing 1-{tasks?.length} of {tasks?.length} tasks
          </p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-md text-sm">
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
              Next
            </button>
          </div>
        </div>
      </div>

      <FlaggedTasksDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        flaggedTasks={flaggedTasks}
      />
    </>
  );
};

const UserTable = ({ users }) => {
  const TableHeader = () => (
    <thead className="border-b border-gray-200">
      <tr className="text-gray-600 text-left text-sm">
        <th className="py-3 px-3 font-medium">Team Member</th>
        <th className="py-3 px-3 font-medium">Status</th>
        <th className="py-3 px-3 font-medium">Joined</th>
        <th className="py-3 px-3 font-medium"></th>
      </tr>
    </thead>
  );

  const TableRow = ({ user }) => (
    <tr className="border-b border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm bg-gradient-to-br from-violet-600 to-violet-800 shadow-sm">
            <span className="text-center">{getInitials(user?.name)}</span>
          </div>

          <div>
            <p className="font-medium text-gray-800">{user.name}</p>
            <span className="text-xs text-gray-500">
              {user?.title || user?.role}
            </span>
          </div>
        </div>
      </td>

      <td className="py-3 px-3">
        <p
          className={clsx(
            "w-fit px-2.5 py-1 rounded-full text-xs font-medium",
            user?.isActive
              ? "bg-green-50 text-green-600"
              : "bg-yellow-50 text-yellow-600"
          )}
        >
          {user?.isActive ? "Active" : "Inactive"}
        </p>
      </td>

      <td className="py-3 px-3 text-sm text-gray-500">
        {moment(user?.createdAt).fromNow()}
      </td>

      <td className="py-3 px-3 text-right">
        <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
          <BsThreeDotsVertical className="text-gray-500" />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="w-full md:w-1/3 bg-white px-4 py-5 shadow-sm rounded-xl border border-gray-100">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-xl font-semibold text-gray-800">Team Members</h3>
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          Add Member
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader />
          <tbody>
            {users?.map((user, index) => (
              <TableRow key={index + user?._id} user={user} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <button className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
          View All Team Members
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  // Assume we're using the updated data structure

  const { data, isLoading } = useGetDashboardStatsQuery();

  if (isLoading)
    return (
      <div className="py-10">
        <Loading />
      </div>
    );

  const totals = data?.tasks;

  const stats = [
    {
      _id: "1",
      label: "Total Tasks",
      total: data?.totalTasks || 0,
      icon: <FaNewspaper />,
      bg: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      _id: "2",
      label: "Completed Tasks",
      total: totals["completed"] || 0,
      icon: <MdAdminPanelSettings />,
      bg: "bg-gradient-to-br from-teal-500 to-teal-600",
    },
    {
      _id: "3",
      label: "Tasks In Progress",
      total: totals["in progress"] || 0,
      icon: <LuClipboardPen />,
      bg: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
    {
      _id: "4",
      label: "Todo Tasks",
      total: totals["todo"] || 0,
      icon: <FaArrowsToDot />,
      bg: "bg-gradient-to-br from-pink-500 to-pink-600",
    },
  ];

  const Card = ({ label, count, bg, icon }) => {
    return (
      <div className="w-full bg-white p-5 shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div
            className={clsx(
              "w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-md",
              bg
            )}
          >
            {icon}
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-800">{count}</span>
            </div>
          </div>

          <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <MdMoreVert className="text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-6">
      {/* Header section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Task Dashboard</h1>
          <p className="text-gray-500">
            Welcome back! Here's what's happening today
          </p>
        </div>
      </div>

      {/************ STATS CARDS **********/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ icon, bg, label, total }, index) => (
          <Card key={index} icon={icon} bg={bg} label={label} count={total} />
        ))}
      </div>

      {/***********  CHART SECTION ************* */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-bold text-gray-800">
            Priority Distribution
          </h4>

          <div className="w-full bg-white my-16 p-4 rounded shadow-sm">
            <h4 className="text-xl text-gray-600 font-semibold">
              Chart by Priority
            </h4>
            <Chart data={data?.graphData} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h4 className="text-lg font-semibold text-gray-800">
              Important Metrics
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="border border-gray-100 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <div
                className="flex items-center gap-2 mb-2"
                onClick={() => handleTaskFlagClick(task)}
              >
                <BsFlagFill className="text-red-500" />
                <p className="text-gray-700 font-medium">Flagged Tasks</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {data.last10Task?.filter((t) => t.flagged).length || 0}
              </p>
            </div>

            <div className="border border-gray-100 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <FaLocationDot className="text-green-500" />
                <p className="text-gray-700 font-medium">Location-based</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {data.last10Task?.filter((t) => t.atLocation).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task distribution */}

      {/* Tables section */}
      <div className="w-full flex flex-col md:flex-row gap-6 py-8">
        {/* Left side - Tasks table */}
        <TaskTable tasks={data?.last10Task} />

        {/* Right side - Users table */}
        <UserTable users={data?.users} />
      </div>
    </div>
  );
};

export default Dashboard;
