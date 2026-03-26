export class DemoLogger {
  constructor(setLogState) {
    this.setLogState = setLogState;
    this.logs = [];
  }

  log(message, type = 'info') {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type, // 'info', 'success', 'error', 'warning'
    };
    this.logs.push(entry);
    if (this.setLogState) {
      this.setLogState(prev => [...prev, entry]);
    }
    console.log(`[DemoAuto] [${type.toUpperCase()}] ${message}`);
  }

  clear() {
    this.logs = [];
    if (this.setLogState) {
      this.setLogState([]);
    }
  }
}
