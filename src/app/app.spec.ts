import { App } from './app';

describe('App', () => {
  it('should create the root app instance', () => {
    const app = new App();
    expect(app).toBeTruthy();
  });
});
