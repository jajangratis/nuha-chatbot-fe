import { fetchNuhaMirror } from "@/lib/nuha-mirror";

export async function NuhaMirror() {
  const { bodyHtml, styleLinks } = await fetchNuhaMirror();

  return (
    <>
      {styleLinks.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      <div
        className="nuha-mirror min-h-screen"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </>
  );
}
