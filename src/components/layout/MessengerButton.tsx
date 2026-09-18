const MESSENGER_ICON_PATH =
  "M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z";

const MESSENGER_HREF = "https://m.me/CMUDBD";

/** Floating "chat on Messenger" button, stacked above the WhatsApp button. */
export function MessengerButton() {
  return (
    <a
      href={MESSENGER_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on Messenger"
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0084FF] shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0084FF] focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-28 sm:right-6"
    >
      <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7">
        <path d={MESSENGER_ICON_PATH} />
      </svg>
    </a>
  );
}
