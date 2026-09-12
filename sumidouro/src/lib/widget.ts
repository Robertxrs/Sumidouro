export function notifyWidgetRefresh() {
  if (typeof window !== 'undefined') {
    if ((window as any).WidgetBridge && typeof (window as any).WidgetBridge.refreshWidget === 'function') {
      try {
        (window as any).WidgetBridge.refreshWidget();
      } catch (e) {
        console.error('Erro ao atualizar o widget via bridge:', e);
      }
    }
  }
}
