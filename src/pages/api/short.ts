import { createPool } from "@vercel/postgres";

const redirectURL = import.meta.env.PUBLIC_REDIRECT_URL;

export const pool = createPool({
  connectionString: import.meta.env.POSTGRES_URL,
});

const getShortURL = async (): Promise<string> => {
  const shorturl = Math.random().toString(36).substring(2, 8);

  //Check if short URL exists in database
  try {
    pool.connect();
    const query = `SELECT * FROM short_urls WHERE shorturl = '${shorturl}'`;
    const sqlResponse = await pool.query(query);
    if (sqlResponse.rowCount !== 0) {
      //If short URL exists, check another short URL
      return getShortURL();
    }
    //If short URL does not exist, return short URL
    return shorturl;
  } catch (e) {
    //If error with DB, return error
    return JSON.stringify(e);
  }
};

export const POST = async ({ request }: { request: Request }) => {
  //POST url to be shortened
  const body = await request.json();
  const longurl = body.longurl;

  //Create short URL
  const shorturl = await getShortURL();

  //If error with DB, return error
  try {
    if (JSON.parse(shorturl).message) {
      return new Response(shorturl, {
        headers: {
          "content-type": "text/html",
        },
        status: 500,
      });
    }
  } catch (error) {
    try {
      pool.connect();
      const timestamp = new Date(Date.now())
        .toISOString()
        .replace("T", " ")
        .replace("Z", "");
      const query = `INSERT INTO short_urls (shorturl, longurl, created_time) VALUES ('${shorturl}', '${longurl}', '${timestamp}')`;
      await pool.query(query);

      return new Response(
        JSON.stringify({ shorturl: `${redirectURL}${shorturl}` }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 200,
        }
      );
    } catch (e) {
      //If error with DB, redirect to 404 page
      return new Response(`Response: ${JSON.stringify(e)}`, {
        headers: {
          "content-type": "text/html",
        },
        status: 404,
      });
    }
  }
};
