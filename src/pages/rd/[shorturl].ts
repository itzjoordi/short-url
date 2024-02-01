import type { APIContext } from "astro";
import { createPool } from "@vercel/postgres";

export const pool = createPool({
  connectionString: import.meta.env.POSTGRES_URL,
});

export async function GET({ request }: APIContext) {
  //All short URLs are 6 characters long
  const splitURL = request.url.split("/");
  const shortURL = splitURL[splitURL.length - 1];

  if (shortURL.length !== 6) {
    return new Response(JSON.stringify({ message: "Invalid URL" }), {
      headers: {
        Location: "/404",
        "content-type": "text/html",
      },
      status: 301,
    });
  }

  try {
    //Check if short URL exists in database
    pool.connect();
    const query = `SELECT * FROM short_urls WHERE shorturl = '${shortURL}'`;
    const sqlResponse = await pool.query(query);

    if (sqlResponse.rowCount === 1) {
      //If short URL exists, redirect to long URL
      return new Response(`Response: ${JSON.stringify(sqlResponse)}`, {
        headers: {
          Location: sqlResponse.rows[0].longurl,
          "content-type": "text/html",
        },
        status: 301,
      });
    } else {
      //If short URL does not exist, redirect to 404 page
      return new Response(JSON.stringify(sqlResponse), {
        headers: {
          Location: "/404",
          "content-type": "text/html",
        },
        status: 301,
      });
    }
  } catch (e) {
    //If error with DB, redirect to 404 page
    return new Response(`Response: ${JSON.stringify(e)}`, {
      headers: {
        Location: "/404",
        "content-type": "text/html",
      },
      status: 301,
    });
  }
}
