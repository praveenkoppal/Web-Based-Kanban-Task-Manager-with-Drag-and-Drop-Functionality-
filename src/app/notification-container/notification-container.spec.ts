import 'zone.js/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationContainer } from './notification-container';
import { NotificationService } from '../services/notification.service';
import { By } from '@angular/platform-browser';

describe('NotificationContainer', () => {
  let fixture: ComponentFixture<NotificationContainer>;
  let service: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationContainer],
      providers: [NotificationService],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationContainer);
    service = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  it('should show and then remove a notification with animation', fakeAsync(() => {
    service.info('test');
    fixture.detectChanges();

    let items = fixture.debugElement.queryAll(By.css('.notification'));
    expect(items.length).toBe(1);

    // after the two-second timer the service will drop the item;
    // component should mark it closing and run slide-out class
    tick(2000);
    fixture.detectChanges();

    items = fixture.debugElement.queryAll(By.css('.notification'));
    expect(items.length).toBe(1);
    expect(items[0].classes['slide-out']).toBe(true);

    // wait for animation to finish and the element to be removed
    tick(300);
    fixture.detectChanges();

    items = fixture.debugElement.queryAll(By.css('.notification'));
    expect(items.length).toBe(0);
  }));

  it('should respond to manual close click', fakeAsync(() => {
    service.warning('click me');
    fixture.detectChanges();

    let items = fixture.debugElement.queryAll(By.css('.notification'));
    expect(items.length).toBe(1);

    const button = fixture.debugElement.query(By.css('.notification-close'));
    button.triggerEventHandler('click', null);
    fixture.detectChanges();

    // service.remove will fire immediately; component marks closing
    tick();
    fixture.detectChanges();
    items = fixture.debugElement.queryAll(By.css('.notification'));
    expect(items[0].classes['slide-out']).toBe(true);

    tick(300);
    fixture.detectChanges();
    items = fixture.debugElement.queryAll(By.css('.notification'));
    expect(items.length).toBe(0);
  }));
});
