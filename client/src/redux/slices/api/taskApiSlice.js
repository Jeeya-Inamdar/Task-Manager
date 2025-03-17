import { apiSlice } from "../apiSlice";

const TASKS_URL = "/task";

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    postTaskActivity: builder.mutation({
      query: ({ data, id }) => ({
        url: `${TASKS_URL}/activity/${id}`,
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),
    getDashboardStats: builder.query({
      query: () => ({
        url: `${TASKS_URL}/dashboard`,
        method: "GET",
        credentials: "include",
      }),
    }),

    getAllTasks: builder.query({
      query: ({ stage, isTrashed, viewType }) => ({
        url: `${TASKS_URL}`,
        method: "GET",
        credentials: "include",
        params: { stage, isTrashed, viewType },
      }),
    }),

    getTaskById: builder.query({
      query: (id) => ({
        url: `${TASKS_URL}/${id}`,
        method: "GET",
        credentials: "include",
      }),
    }),

    createTask: builder.mutation({
      query: (data) => ({
        url: `${TASKS_URL}/create`,
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

    createSubtask: builder.mutation({
      query: ({ id, data }) => ({
        url: `${TASKS_URL}/create-subtask/${id}`,
        method: "PUT",
        body: data,
        credentials: "include",
      }),
    }),

    updateTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `${TASKS_URL}/update/${id}`,
        method: "PUT",
        body: data,
        credentials: "include",
      }),
    }),

    trashTask: builder.mutation({
      query: ({ id }) => ({
        url: `${TASKS_URL}/${id}`,
        method: "PUT",
        credentials: "include",
      }),
    }),
    deleteOrRestoreTask: builder.mutation({
      query: ({ id, actionType }) => ({
        url: `${TASKS_URL}/delete-restore/${id}?actionType=${actionType}`,
        method: "DELETE",
        credentials: "include",
      }),
    }),

    addAttachment: builder.mutation({
      query: ({ id, attachment }) => {
        const formatData = new FormData();
        formatData.append("attachment", attachment);
        return {
          url: `${TASKS_URL}/upload-attachment/${id}`,
          method: "POST",
          body: formatData,
          credentials: "include",
        };
      },
    }),

    getAttachments: builder.query({
      query: (taskId) => ({
        url: `${TASKS_URL}/attachments/${taskId}`,
        method: "GET",
        credentials: "include",
      }),
    }),

    removeAttachment: builder.mutation({
      query: (attachmentId) => ({
        url: `${TASKS_URL}/delete-attachment/${attachmentId}`,
        method: "Delete",
        credentials: "include",
      }),
    }),

    getNotesByTaskId: builder.query({
      query: (taskId) => ({
        url: `${TASKS_URL}/${taskId}/notes`,
        method: "GET",
        credentials: "include",
      }),
    }),

    deleteNotes: builder.mutation({
      query: (taskId) => ({
        url: `${TASKS_URL}/${taskId}/notes`,
        method: "DELETE",
        credentials: "include",
      }),
    }),

    addVoiceNotes: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("voiceNote", file);

        return {
          url: `${TASKS_URL}/${taskId}/voice-note`,
          method: "POST",
          body: formData,
          credentials: "include",
        };
      },
    }),
  }),
});

export const {
  usePostTaskActivityMutation,
  useGetAllTasksQuery,
  useGetDashboardStatsQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useCreateSubtaskMutation,
  useUpdateTaskMutation,
  useTrashTaskMutation,
  useDeleteOrRestoreTaskMutation,
  useAddAttachmentMutation,
  useGetAttachmentsQuery,
  useRemoveAttachmentMutation,
  useAddVoiceNotesMutation,
  useDeleteNotesMutation,
  useGetNotesByTaskIdQuery,
} = taskApiSlice;
