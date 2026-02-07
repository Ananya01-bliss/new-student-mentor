import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterMentorComponent } from './register-mentor.component';

describe('RegisterMentorComponent', () => {
  let component: RegisterMentorComponent;
  let fixture: ComponentFixture<RegisterMentorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterMentorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterMentorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
