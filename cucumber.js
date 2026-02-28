module.exports = {
  // npm run test:functional → verbose (pretty)
  default: {
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.js'],
    format: ['pretty', 'json:test-results/cucumber-report.json'],
    publishQuiet: true,
  },
  // npm test → resumido (progress)
  summary: {
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.js'],
    format: ['progress', 'json:test-results/cucumber-report.json'],
    publishQuiet: true,
  },
};
