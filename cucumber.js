module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.js'],
    format: ['progress-bar', 'json:test-results/cucumber-report.json'],
    publishQuiet: true,
  },
};
