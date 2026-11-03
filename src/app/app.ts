import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from './supabase.service';

interface RsvpWish {
  guest_name: string;
  guest_message: string;
  created_at: string;
}

interface RsvpRecord {
  attendance: string;
  guest_count: number;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);

  // =====================================
  // WEDDING MUSIC
  // =====================================
  private sanitizer = inject(DomSanitizer);

  isMusicPlaying = true;

  youtubeMusicUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://www.youtube.com/embed/4Wxi4sVCeo0?autoplay=1&loop=1&playlist=4Wxi4sVCeo0&playsinline=1&enablejsapi=1',
  );

  toggleMusic(): void {
    this.isMusicPlaying = !this.isMusicPlaying;

    const iframe = document.querySelector(
      'iframe[title="Wedding Background Music"]',
    ) as HTMLIFrameElement;

    iframe?.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func: this.isMusicPlaying ? 'playVideo' : 'pauseVideo',
        args: [],
      }),
      'https://www.youtube.com',
    );
  }
  private countdownInterval?: ReturnType<typeof setInterval>;

  // =====================================
  // WEDDING DETAILS - EDIT HERE ONLY
  // =====================================

  readonly weddingDetails = {
    bride: 'Aisyah',
    groom: 'Aiman',

    brideFullName: 'Aisyah Binti Ahmad',
    groomFullName: 'Muhammad Aiman Bin Shafiq',

    fatherName: 'Ahmad Bin Ali',
    motherName: 'Hanis Binti Hussin',

    venue: 'Green Glass Hall',
    location: 'Masai, Johor',

    address: 'Jalan Tasek 4, Bandar Seri Alam, 81750 Masai, Johor, Malaysia',

    // Wedding date and time (Malaysia timezone)
    date: new Date('2027-09-08T11:00:00+08:00'),

    // Wedding schedule
    startTime: '11.00 pagi',
    endTime: '4.00 petang',
    brideArrival: '12.30 tengah hari',

    // RSVP deadline
    rsvpDeadline: new Date('2027-09-08T00:00:00+08:00'),

    // Leave empty until the Hijri date is verified
    hijriDate: '',

    // DuitNow QR image
    qrImage: '/images/qr-duitnow.png',
  };

  // =====================================
  // ENVELOPE
  // =====================================

  isOpened = signal(false);
  showDetails = signal(false);

  // =====================================
  // RSVP FORM
  // =====================================

  guestName = '';
  attendance = '';
  guestCount = 1;
  guestMessage = '';

  rsvpSubmitted = signal(false);
  isSubmitting = signal(false);
  rsvpError = signal('');

  // =====================================
  // WISHES
  // =====================================

  wishes = signal<RsvpWish[]>([]);
  wishesLoading = signal(false);
  wishesError = signal('');

  // =====================================
  // RSVP STATISTICS
  // =====================================

  rsvpRecords = signal<RsvpRecord[]>([]);

  totalHadir = signal(0);
  totalTidakHadir = signal(0);

  // =====================================
  // COUNTDOWN
  // =====================================

  countdown = signal<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // =====================================
  // LIFECYCLE
  // =====================================

  ngOnInit(): void {
    this.loadWishes();
    this.loadRsvpStatistics();

    this.updateCountdown();

    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // =====================================
  // DATE FORMATTING
  // =====================================

  getDayName(): string {
    return this.weddingDetails.date.toLocaleDateString('ms-MY', {
      weekday: 'long',
      timeZone: 'Asia/Kuala_Lumpur',
    });
  }

  getWeddingDate(): string {
    return this.weddingDetails.date.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
    });
  }

  getRsvpDeadline(): string {
    return this.weddingDetails.rsvpDeadline.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
    });
  }

  // =====================================
  // COUNTDOWN FUNCTION
  // =====================================

  updateCountdown(): void {
    const now = Date.now();

    const difference = this.weddingDetails.date.getTime() - now;

    if (difference <= 0) {
      this.countdown.set({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });

      return;
    }

    const totalSeconds = Math.floor(difference / 1000);

    this.countdown.set({
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    });
  }

  // =====================================
  // OPEN ENVELOPE
  // =====================================

  openEnvelope(): void {
    if (this.isOpened()) return;

    this.isOpened.set(true);

    const envelope = document.querySelector('.envelope');

    if (!envelope) return;

    envelope.classList.add('opened');

    setTimeout(() => {
      envelope.classList.add('flap-behind');

      setTimeout(() => {
        envelope.classList.add('letter-out');

        setTimeout(() => {
          this.showDetails.set(true);
        }, 1400);
      }, 200);
    }, 1200);
  }

  // =====================================
  // LOAD WISHES
  // =====================================

  async loadWishes(): Promise<void> {
    this.wishesLoading.set(true);
    this.wishesError.set('');

    try {
      const { data, error } = await this.supabaseService.getRsvpWishes();

      if (error) throw error;

      this.wishes.set((data ?? []) as RsvpWish[]);
    } catch (error) {
      console.error('Load wishes error:', error);

      this.wishesError.set('Tidak dapat memuatkan ucapan buat masa ini.');
    } finally {
      this.wishesLoading.set(false);
    }
  }

  // =====================================
  // LOAD RSVP STATISTICS
  // =====================================

  async loadRsvpStatistics(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.getAllRsvps();

      if (error) throw error;

      const records = (data ?? []) as RsvpRecord[];

      this.rsvpRecords.set(records);

      // Total number of guests attending
      const hadir = records
        .filter((rsvp) => rsvp.attendance === 'Hadir')
        .reduce((total, rsvp) => total + (Number(rsvp.guest_count) || 0), 0);

      // Total RSVP records not attending
      const tidakHadir = records.filter((rsvp) => rsvp.attendance === 'Tidak Hadir').length;

      this.totalHadir.set(hadir);
      this.totalTidakHadir.set(tidakHadir);
    } catch (error) {
      console.error('Load RSVP statistics error:', error);
    }
  }

  // =====================================
  // SUBMIT RSVP
  // =====================================

  async submitRsvp(): Promise<void> {
    if (!this.guestName.trim() || !this.attendance) {
      this.rsvpError.set('Sila isi nama dan pilih pengesahan kehadiran.');

      return;
    }

    if (this.guestMessage.length > 1000) {
      this.rsvpError.set('Ucapan tidak boleh melebihi 1000 aksara.');

      return;
    }

    if (this.attendance === 'Hadir' && (this.guestCount < 1 || this.guestCount > 10)) {
      this.rsvpError.set('Sila pilih jumlah tetamu antara 1 hingga 10.');

      return;
    }

    this.isSubmitting.set(true);
    this.rsvpError.set('');

    try {
      const { error } = await this.supabaseService.submitRsvp({
        guest_name: this.guestName.trim(),
        attendance: this.attendance,

        guest_count: this.attendance === 'Hadir' ? this.guestCount : 0,

        guest_message: this.guestMessage.trim(),
      });

      if (error) throw error;

      this.rsvpSubmitted.set(true);

      // Refresh wishes and statistics
      await Promise.all([this.loadWishes(), this.loadRsvpStatistics()]);
    } catch (error) {
      console.error('RSVP Error:', error);

      this.rsvpError.set('RSVP tidak berjaya dihantar. Sila cuba lagi.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // =====================================
  // FORMAT WISH DATE
  // =====================================

  formatWishDate(date: string): string {
    return new Date(date).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // =====================================
  // GOOGLE MAPS
  // =====================================

  get googleMapsUrl(): string {
    const address = `${this.weddingDetails.venue}, ${this.weddingDetails.address}`;

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  // =====================================
  // WAZE
  // =====================================

  get wazeUrl(): string {
    const address = `${this.weddingDetails.venue}, ${this.weddingDetails.address}`;

    return `https://waze.com/ul?q=${encodeURIComponent(address)}`;
  }

  // =====================================
  // GOOGLE CALENDAR
  // =====================================

  get googleCalendarUrl(): string {
    const startDate = this.weddingDetails.date;

    const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000);

    const formatDate = (date: Date): string =>
      date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z');

    const params = new URLSearchParams({
      action: 'TEMPLATE',

      text: `Walimatul Urus ${this.weddingDetails.bride} & ${this.weddingDetails.groom}`,

      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,

      details: 'Majlis perkahwinan',

      location: `${this.weddingDetails.venue}, ${this.weddingDetails.address}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}
