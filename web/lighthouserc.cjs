/** B5 performance budget — /welcome marketing page on mid-range mobile profile. */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start --workspace web",
      startServerReadyPattern: "Ready",
      url: ["http://127.0.0.1:3000/welcome"],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "total-blocking-time": ["warn", { maxNumericValue: 600 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
