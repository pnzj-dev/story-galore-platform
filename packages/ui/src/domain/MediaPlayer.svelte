<script lang="ts">
  import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from '@lucide/svelte';

  let {
    src,
    poster,
    kind = 'video',
    captions,
    autoplay = false,
    controls = true,
    guarded = false,
    startAt = 0,
    onended,
    ontimeupdate,
    class: className = '',
  }: {
    src: string;
    poster?: string;
    kind?: 'video' | 'audio';
    captions?: string;
    autoplay?: boolean;
    controls?: boolean;
    /** Disable the native download/picture-in-picture affordances and right-click save. */
    guarded?: boolean;
    /** Initial playback position in seconds (resume). */
    startAt?: number;
    /** Fired when the media plays to completion. */
    onended?: () => void;
    /** Fired on timeupdate with the current position and duration in seconds. */
    ontimeupdate?: (currentTime: number, duration: number) => void;
    class?: string;
  } = $props();

  let mediaEl: HTMLMediaElement | null = $state(null);
  let containerEl: HTMLDivElement | null = $state(null);
  let currentTime = $state(0);
  let duration = $state(0);
  let volume = $state(1);
  let muted = $state(false);
  let paused = $state(true);
  let fullscreen = $state(false);

  function formatTime(t: number): string {
    if (!Number.isFinite(t) || t <= 0) return '0:00';
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function togglePlay() {
    if (!mediaEl) return;
    if (mediaEl.paused) mediaEl.play();
    else mediaEl.pause();
  }

  function toggleMute() {
    if (!mediaEl) return;
    mediaEl.muted = !mediaEl.muted;
    muted = mediaEl.muted;
  }

  function toggleFullscreen() {
    if (!containerEl || kind === 'audio') return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerEl.requestFullscreen?.();
    }
  }

  function onDurationChange() {
    duration = mediaEl?.duration ?? 0;
  }

  function blockContextMenu(e: MouseEvent) {
    if (guarded) e.preventDefault();
  }

  function onLoadedMetadata() {
    if (mediaEl && startAt > 0 && mediaEl.duration > 0 && mediaEl.currentTime < startAt) {
      mediaEl.currentTime = startAt;
      currentTime = startAt;
    }
  }

  function onTimeUpdate() {
    if (mediaEl) ontimeupdate?.(mediaEl.currentTime, mediaEl.duration);
  }
</script>

<div
  bind:this={containerEl}
  class="group/media relative overflow-hidden rounded-md border border-border bg-black {className}"
>
  {#if kind === 'audio'}
    <audio
      bind:this={mediaEl}
      {src}
      {autoplay}
      preload="metadata"
      controlslist={guarded ? 'nodownload' : undefined}
      oncontextmenu={blockContextMenu}
      onended={onended}
      onloadedmetadata={onLoadedMetadata}
      ontimeupdate={onTimeUpdate}
      bind:currentTime={currentTime}
      bind:duration={duration}
      bind:volume={volume}
      bind:muted={muted}
      bind:paused={paused}
      ondurationchange={onDurationChange}
      class="sr-only"
    ></audio>
  {:else}
    <!-- svelte-ignore a11y_media_has_caption -- captions are optional for a generic player -->
    <video
      bind:this={mediaEl}
      {src}
      {poster}
      {autoplay}
      preload="metadata"
      playsinline
      controlslist={guarded ? 'nodownload' : undefined}
      disablepictureinpicture={guarded}
      oncontextmenu={blockContextMenu}
      onended={onended}
      onloadedmetadata={onLoadedMetadata}
      ontimeupdate={onTimeUpdate}
      bind:currentTime={currentTime}
      bind:duration={duration}
      bind:volume={volume}
      bind:muted={muted}
      bind:paused={paused}
      ondurationchange={onDurationChange}
      class="h-full w-full object-contain"
    >
      {#if captions}
        <track kind="captions" src={captions} srclang="en" label="English" />
      {/if}
    </video>
  {/if}

  {#if controls}
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 opacity-0 transition group-hover/media:opacity-100 group-hover/media:pointer-events-auto"
    >
      <button
        type="button"
        onclick={togglePlay}
        aria-label={paused ? 'Play' : 'Pause'}
        class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/20"
      >
        {#if paused}
          <Play size={18} fill="currentColor" />
        {:else}
          <Pause size={18} fill="currentColor" />
        {/if}
      </button>

      <span class="shrink-0 text-[11px] tabular-nums text-white/90">{formatTime(currentTime)}</span>

      <input
        type="range"
        min="0"
        max={duration || 0}
        step="0.1"
        value={currentTime}
        oninput={(e) => (currentTime = Number((e.currentTarget as HTMLInputElement).value))}
        aria-label="Seek"
        class="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
      />

      <span class="shrink-0 text-[11px] tabular-nums text-white/90">{formatTime(duration)}</span>

      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onclick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          class="grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-white/20"
        >
          {#if muted || volume === 0}
            <VolumeX size={18} />
          {:else}
            <Volume2 size={18} />
          {/if}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          oninput={(e) => (volume = Number((e.currentTarget as HTMLInputElement).value))}
          aria-label="Volume"
          class="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
        />

        {#if kind === 'video'}
          <button
            type="button"
            onclick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            class="grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-white/20"
          >
            {#if fullscreen}
              <Minimize size={18} />
            {:else}
              <Maximize size={18} />
            {/if}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
