import Router from 'koa-router'
import { config } from '../utils'
import fetch from 'node-fetch'
import { Client } from 'pg'
import constants from '../constants'

const router = new Router();

router.get(`${constants.BASE_URI}/updateRecomendations`, async (ctx) => {
  try {
    const response = await fetch("https://democenter.nitrosbase.com/clinrecalg5/API.ashx?op=GetJsonClinrecs&ssid=");
    const list = await response.json();
    const recomendations = []
    for await (let element of list.adults) {
      if (element.level == 2) {
        try {
          const response = await getAdditionalInfo(element.Id);
          const additionalInfo = await response;
          element.diagnostics = additionalInfo.diagnostics;
          element.treatment = additionalInfo.treatment;
          element.rehabilitation = additionalInfo.rehabilitation;
          element.prevention = additionalInfo.prevention;
          element.year = additionalInfo.year;
         
          recomendations.push(element)
          
        } catch (err) {
          console.log(err)
        }
      }
    }
    for await (let element of list.children) {
      if (element.level == 2) {
        try {
          const response = await getAdditionalInfo(element.Id);
          const additionalInfo = await response;
          element.diagnostics = additionalInfo.diagnostics;
          element.treatment = additionalInfo.treatment;
          element.rehabilitation = additionalInfo.rehabilitation;
          element.prevention = additionalInfo.prevention;
          element.year = additionalInfo.year;
       
          recomendations.push(element)
         
        } catch (err) {
          console.log(err)
        }
      }
    }
    const recToMkb = []
    const pg = new Client(config)
    await pg.connect()
    await pg.query(`BEGIN TRANSACTION`)
    for await (let recomendation of recomendations) {
      try {
        const result = await pg.query(queries.insertRecommendation, [recomendation.name, recomendation.ass, recomendation.diagnostics, recomendation.treatment, recomendation.rehabilitation, recomendation.prevention, recomendation.revision_year])
        console.log(result.rows[0])
        recToMkb.push({
          recomendation_id: result.rows[0].recomendation_id,
          mkbCodes: recomendation.Mkb
        })
      } catch (err) {
        console.log(err)
      }
    }
    await pg.query(`COMMIT`)
    for await (let rec of recToMkb) {
      try {
        for await (let mkb of rec.mkbCodes) {
          await pg.query(queries.insertRecomendationToMkb, [rec.recomendation_id, `${mkb}[*|+]?`])
        }
      } catch (err) {
        console.log(err)
      }
    }
    await pg.end()
  } catch (err) {
    console.log(err)
  }

})


async function getAdditionalInfo(id) {
  let promise = new Promise((resolve, reject) => {
    fetch("https://democenter.nitrosbase.com/clinrecalg5//API.ashx?op=GetClinrec2&id=" + id)
      .then(res => res.json())
      .then(json => {
        let arr = {};
        

        json.obj.sections.map(function (element) {
          if (element.id == "doc_2") {
            arr.diagnostics = element.content;
          }
          if (element.id == "doc_3") {
            arr.treatment = element.content;
          }
          if (element.id == "doc_4") {
            arr.rehabilitation = element.content;
          }
          if (element.id == "doc_5") {
            arr.prevention = element.content;
          }
          if (element.id == "doc_title") {
            arr.year = element.data[2].content;
          }
        });

        resolve(arr);
      });
  });

  let result = await promise;

  return result;
}


const queries = {
  insertRecommendation: `
    INSERT INTO recomendations.recomendation
                (
                  name,
                  ass,
                  diagnostics,
                  treatment,
                  rehabilitation,
                  prevention,
                  revision_year
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING recomendation_id
  `,
  insertRecomendationToMkb: `
    INSERT INTO recomendations.recomendation_mkb_codes
                (
                  recomendation_id,
                  mkb_code_id
                )
                VALUES (
                  $1,
                  (select mkb_code_id from recomendations.mkb_code where mkb_code similar to $2 limit 1)
                )
  `
}

export default router;
