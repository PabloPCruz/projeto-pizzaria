// Configuração do Karma. Igual à padrão do Angular, com um navegador extra para CI (Chrome sem interface e sem sandbox,
// necessário em containers/GitHub Actions rodando como root): npm run test:ci
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {
        // Ordem aleatória: um teste que depende de outro aparece rápido.
        random: true,
      },
      clearContext: false, // deixa a saída do Jasmine visível no navegador
    },
    jasmineHtmlReporter: {
      suppressAll: true, // remove traços duplicados
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/projeto-pizzaria'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu'],
      },
    },
    restartOnFileChange: true,
  });
};
