import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElwaziHeaderComponent } from './elwazi-header.component';

describe('ElwaziHeaderComponent', () => {
  let component: ElwaziHeaderComponent;
  let fixture: ComponentFixture<ElwaziHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ElwaziHeaderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ElwaziHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
