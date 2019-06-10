export class NotificationService {

  public permissionGranted: boolean = false;

  public Init() {
    this.RequestPermissions();
  }

  public RequestPermissions() {
    Notification.requestPermission().then((result) => {
      if (result == 'granted')
        this.permissionGranted = true;
      if (result == 'denied')
        this.permissionGranted = false;
    });
  }
}