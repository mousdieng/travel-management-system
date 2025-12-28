import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UsersListComponent } from './users-list/users-list.component';

const routes: Routes = [
  {
    path: '',
    component: UsersListComponent,
    title: 'Users - Travel Plan Admin'
  },
  // TODO: Add user sub-routes as components are implemented
  // {
  //   path: 'create',
  //   component: UserFormComponent,
  //   title: 'Create User - Travel Plan Admin'
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }