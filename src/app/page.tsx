import Image from "next/image";
import styles from "./page.module.css";
import Chat from "../components/Chat.jsx";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Chat />
      </main>

      <footer className={styles.footer}>
        <div>
          {/* <a href="/" target="_blank" rel="noopener noreferrer">
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
            />
            Go to home →
          </a> */}
        </div>
      </footer>
    </div>
  );
}
