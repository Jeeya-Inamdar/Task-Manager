import { apiSlice } from "../apiSlice";

const TASKS_URL = "/task";

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => ({
        url: `${TASKS_URL}/dashboard`,
        method: "GET",
        credentials: "include",
      }),
    }),

    getAllTasks: builder.query({
        query: ({ stage, isTrashed, viewType }) => {
          console.log("Fetching tasks with params:", { stage, isTrashed, viewType });
          return {
            url: `${TASKS_URL}/view`,
            method: "GET",
            credentials: "include",
            params: { stage, isTrashed, viewType },
          };
        },
      }),


   
    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),
    createTask: builder.mutation({
      query: (taskData) => ({
        url: "/tasks",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: ["Task"],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...taskData }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Task", id }],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Task", id }],
    }),
  }),
});

export const {
  useGetAllTasksQuery,
  useGetDashboardStatsQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApiSlice;
