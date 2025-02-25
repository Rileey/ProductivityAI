const os = require('os');

export function getAvailableParallelism() {
  try {
    if (typeof os.availableParallelism === 'function') {
      return os.availableParallelism();
    }
    // Fallback to CPU count
    return os.cpus().length;
  } catch (error) {
    // Default fallback if nothing else works
    return 4;
  }
} 