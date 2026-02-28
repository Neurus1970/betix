module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.js'],
    format: ['pretty', 'json:test-results/cucumber-report.json'],
    publishQuiet: true,
  },
};
