export default {
  defaultJobOptions: () => {
    return process.env.NODE_ENV === 'production'
      ? {
        removeOnFail: true,
        timeout: 60000, // 1 min
        stackTraceLimit: 1,
      } : {
      jobId: (new Date()).getTime(), // generating unique job ids for test environment to allow reprocessing of the same message
      removeOnFail: true,
      removeOnComplete: true,
      timeout: 60000, // 1 min
      stackTraceLimit: 1,
    };
  },
};
