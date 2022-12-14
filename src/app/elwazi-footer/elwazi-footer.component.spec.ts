import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElwaziFooterComponent } from './elwazi-footer.component';

describe('ElwaziFooterComponent', () => {
  let component: ElwaziFooterComponent;
  let fixture: ComponentFixture<ElwaziFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ElwaziFooterComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ElwaziFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
