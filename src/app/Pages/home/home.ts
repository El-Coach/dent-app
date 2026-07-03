import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../Components/navbar/navbar';
import { Sidebar } from '../../Components/sidebar/sidebar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, Navbar, Sidebar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
