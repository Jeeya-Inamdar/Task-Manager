// import React from "react";
// import TaskCard from "./TaskCard";

// const BoardView = ({ tasks }) => {
//   return (
//     <div className='w-full py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 2xl:gap-10'>
//       {tasks.map((task, index) => (
//         <TaskCard task={task} key={index} />
//       ))}
//     </div>
//   );
// };

// export default BoardView;

import React from "react";

const BoardView = ({ task, onDragStart }) => {
  // ✅ Ensure task exists before accessing properties
  if (!task) {
    return <div className="text-red-500">Error: Task data is missing</div>;
  }

  return (
    <div 
      className={`bg-white rounded-md shadow-sm p-4 mb-3 cursor-pointer border 
        ${task.isSelected ? 'border-2 border-blue-500' : 'border-gray-200'}`}
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
    >
      <h3 className="text-base font-semibold mb-2">{task.title}</h3>
      <div className="space-y-1.5">
        {/* {task.items && task.items.map((item, index) => ( */}
          {task.map((task, index) => (
          <div key={index} className="text-gray-600 text-sm">
            - {task}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardView;

