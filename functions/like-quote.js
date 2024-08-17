// functions/like-quote.js
const faunadb = require('faunadb');
const q = faunadb.query;

exports.handler = async (event, context) => {
  try {
    const client = new faunadb.Client({ secret: process.env.FAUNADB_SECRET });

    const data = JSON.parse(event.body);
    const quote = data.quote;

    const result = await client.query(
      q.Let(
        {
          match: q.Match(q.Index('likes_by_quote'), quote),
        },
        q.If(
          q.Exists(q.Var('match')),
          q.Update(q.Select(['ref'], q.Get(q.Var('match'))), {
            data: { likes: q.Add(q.Select(['data', 'likes'], q.Get(q.Var('match'))), 1) },
          }),
          q.Create(q.Collection('likes'), { data: { quote: quote, likes: 1 } })
        )
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error: ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to like quote' }),
    };
  }
};
