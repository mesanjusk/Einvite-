export function WeddingLoadingScreen({
  message = "Preparing your invitation",
}: {
  message?: string;
}) {
  const petals = [
    { left: "10%", delay: "0s", duration: "4.2s", size: 12 },
    { left: "24%", delay: ".7s", duration: "5.1s", size: 9 },
    { left: "41%", delay: "1.1s", duration: "4.6s", size: 11 },
    { left: "58%", delay: ".2s", duration: "5.4s", size: 8 },
    { left: "73%", delay: "1.5s", duration: "4.8s", size: 12 },
    { left: "88%", delay: ".9s", duration: "5.2s", size: 10 },
  ];

  return (
    <div className="fixed inset-0 z-[1000000] grid place-items-center overflow-hidden bg-[#fffaf4] text-[#5d2032]">
      <style>{`
        @keyframes wedding-loader-petal {
          0% { transform: translate3d(0,-14vh,0) rotate(0deg); opacity: 0; }
          12% { opacity: .8; }
          100% { transform: translate3d(26px,112vh,0) rotate(320deg); opacity: 0; }
        }
        @keyframes wedding-loader-orbit {
          to { transform: rotate(360deg); }
        }
        @keyframes wedding-loader-breathe {
          0%,100% { transform: scale(.96); opacity: .72; }
          50% { transform: scale(1.035); opacity: 1; }
        }
        @keyframes wedding-loader-shimmer {
          0% { background-position: 200% 50%; }
          100% { background-position: -200% 50%; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(221,185,112,.15),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(101,29,51,.06),transparent_30%)]" />

      {petals.map((petal, index) => (
        <span
          key={index}
          aria-hidden
          className="absolute -top-8 rounded-[70%_30%_70%_30%] bg-[#d9b36a]/45"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size * 1.7,
            animation: `wedding-loader-petal ${petal.duration} linear ${petal.delay} infinite`,
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        <div className="relative grid size-32 place-items-center">
          <div
            className="absolute inset-0 rounded-full border border-[#d7b777]/35"
            style={{ animation: "wedding-loader-breathe 2.6s ease-in-out infinite" }}
          />
          <div
            className="absolute inset-3 rounded-full border border-dashed border-[#8a4054]/30"
            style={{ animation: "wedding-loader-orbit 8s linear infinite" }}
          />
          <div
            className="absolute inset-7 rotate-45 rounded-[28%] border border-[#d7b777]/55"
            style={{ animation: "wedding-loader-orbit 10s linear infinite reverse" }}
          />
          <div className="relative grid size-16 place-items-center rounded-full bg-[#651d33] shadow-[0_18px_45px_rgba(101,29,51,.22)]">
            <span className="font-script text-3xl text-[#f2d08a]">&amp;</span>
          </div>
        </div>

        <p className="mt-6 text-[10px] font-bold tracking-[0.28em] text-[#9a6b47] uppercase">
          Your celebration, beautifully told
        </p>
        <h2 className="font-display mt-2 text-2xl leading-tight text-[#542034]">
          {message}
        </h2>
        <p className="mt-2 max-w-xs text-xs leading-5 text-[#8b756c]">
          Styling the design and preparing a private autosaved draft for you.
        </p>

        <div className="mt-6 h-[3px] w-36 overflow-hidden rounded-full bg-[#eadfd3]">
          <div
            className="h-full w-full bg-[linear-gradient(90deg,transparent,#b57a4f,#651d33,#d9b36a,transparent)] bg-[length:220%_100%]"
            style={{ animation: "wedding-loader-shimmer 1.55s linear infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
