export default defineContentScript({
  matches: ['<all_urls>'],
  all_frames: true,
  run_at: 'document_idle',
  main() {
    import('../src/content/index');
  },
});
