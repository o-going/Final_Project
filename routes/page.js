const express = require('express');
const path = require('path');
const url = require('url');
const fs = require('fs');
const router = express.Router();

const mysql = require('mysql2/promise');
const { captureRejectionSymbol } = require('events');
const { group } = require('console');

let con;
async function init() {
  con = await mysql.createConnection({
    host: 'localhost',
    user: 'gayoung',
    password: 'qawsedrf4578!',
    database: 'final'
  });
  get_dataset()
}

init();

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async(req, res) => {
  let body = req.body;
  console.log(body);
  
  let user;

  try{
    let [users, fileds] = await con.query(`SELECT * FROM \`users\`WHERE email = '${body.email}' AND password = '${body.password}'`);
    console.log('확인');
    console.log(users);
    if(users.length > 0) {
      user = users[0];
    }
    if(user == null) {
      res.send('<script type="text/javascript">alert("잘못된 email 혹은 비밀번호입니다.");location.href="/login";</script>');
      return;
    }
    else{
      console.log(user);
      req.session._id = user.id;
      req.session.email = user.email;
      req.session.name = user.name;
      res.send('<script type="text/javascript"> location.href = "/" </script>');
      return;
    }
  }catch (err){
    console.log(err);
    res.send('<script type="text/javascript">alert("Server Error");location.href="/login";</script>');
    return;
  }
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.post('/signup', async(req, res) => {
  let body = req.body;
  console.log(body);
  try{
    let query = `INSERT INTO \`users\` (\`name\`, \`email\`, \`password\`) VALUES('${body.name}', '${body.email}', '${body.password}')`;
    let query2 = "INSERT INTO `users` (`name`, `email`, `password`) VALUES ('" + body.name + "', '" + body.email + "', '" + body.password + "')";
    await con.query(query);
  }catch(err) {
    console.log(err);
    res.send('<script type="text/javascript">alert("회원가입에 실패하셨습니다.");location.href="/signup";</script>');
    return;
  }
  res.send('<script type="text/javascript">alert("회원가입에 성공하셨습니다.");location.href="/login";</script>');
});

router.get('/techtree', async (req, res) => {
  res.render('techtree', {
    reco: reco_data
  });
});

let dataset_nodes;
let dataset_edges;
let reco_data;

async function get_dataset() {
  // let query = 'SELECT companies.companyId, companies.company, companies.logo_src, position_category, positions.position, positions.tech_stack from companies JOIN positions ON companies.companyId = positions.companyId';
  let query = 'SELECT '
      query += 'companies.companyId, companies.company, companies.logo_src, positions.positionId, positions.position, positions.position_category, positions.tech_stack '
      query += 'FROM companies JOIN positions ON companies.companyId = positions.companyId'
  let [skill, _] = await con.query(query);  
  // console.log(skill)

  graph = {};
  position_list = [];
  tech_list = [];
  company_list = [];

  for(let i=0; i<skill.length; i++) {
    position_category = skill[i].position_category.split(', ');
    tech_stack = JSON.parse(skill[i].tech_stack)
    company = skill[i].company.split('\n');
    // console.log(company)

    for(let j=0; j<tech_stack.length; j++) {
      if(tech_stack[j] == '') continue;
      if(tech_list.includes(tech_stack[j]) == false) {
        tech_list.push(tech_stack[j]);
      }
      for(let k=0; k<position_category.length; k++) {
        if(position_category[k] == '') continue;
        if(position_list.includes(position_category[k]) == false) {
          position_list.push(position_category[k]);
        }
        // 직무 정방향
        if(graph[tech_stack[j]] == undefined) {
          graph[tech_stack[j]] = {}
        }
        if(graph[tech_stack[j]][position_category[k]] == undefined) {
          graph[tech_stack[j]][position_category[k]] = 0
        }
        graph[tech_stack[j]][position_category[k]]++;
        // 역
        // if(graph[position_category[k]] == undefined) {
        //   graph[position_category[k]] = {}
        // }
        // if(graph[position_category[k]][tech_stack[j]] == undefined) {
        //   graph[position_category[k]][tech_stack[j]] = 0
        // }
        // graph[position_category[k]][tech_stack[j]]++;
      }
      
      for(let l=0; l<company.length; l++) {  
        if(company[l] == '') continue;
        if(company_list.includes(company[l]) == false) {
          company_list.push(company[l]);
        }
        // 기업 정방향
        if(graph[tech_stack[j]] == undefined) {
          graph[tech_stack[j]] = {}
        }
        if(graph[tech_stack[j]][company[l]] == undefined) {
          graph[tech_stack[j]][company[l]] = 0
        }
        graph[tech_stack[j]][company[l]]++;
        // 역
        // if(graph[company[l]] == undefined) {
        //   graph[company[l]] = {}
        // }
        // if(graph[company[l]][tech_stack[j]] == undefined) {
        //   graph[company[l]][tech_stack[j]] = 0
        // }
        // graph[company[l]][tech_stack[j]]++;
      } 
    }
  }
  // console.log(graph)
  let nodes = [];
  let edges = [];
  let p_top = [];
  let c_top = [];
  let t_top = [];

  count_tech_com_edge = [];
  total_tech_com_edge = 0

  for(tec of tech_list) {
    let comp_count = 0;
    for(entity in graph[tec]) {
      if(company_list.includes(entity)) {
        comp_count += graph[tec][entity]
      }
    }
    count_tech_com_edge.push({teck_stack: tec, comp_count: comp_count})
    total_tech_com_edge += comp_count
  }
  count_tech_com_edge.sort(function(a,b) {
    return b.comp_count - a.comp_count;
  })
  // console.log(count_tech_com_edge);
  total_comp_count = 0
  for(let a=0; a<5; a++) {
    t_top.push(count_tech_com_edge[a].teck_stack);
    total_comp_count += count_tech_com_edge[a].comp_count
  }
  // console.log(t_top);
  for(let a=0; a<t_top.length; a++) {
    nodes.push({id: t_top[a], value:count_tech_com_edge[a].comp_count / total_comp_count * 100, label: t_top[a], group: 1})
    for(let b in graph) {
      if(t_top.includes(b)) {
        for(let c in graph[b]) {
          if(position_list.includes(c)) {
            let flag = true
            for (p of p_top) {
              if (p.position == c) {
                p.weight += graph[b][c];
                flag = false;
                break;
              }
            }
            if (flag) {
              p_top.push({position: c, weight: graph[b][c]});
            }
          }
          if(company_list.includes(c)) {
            let flag = true
            for (co of c_top) {
              if (co.company == c) {
                co.weight += graph[b][c];
                flag = false;
                break;
              }
            }
            if (flag) {
              c_top.push({company: c, weight: graph[b][c]});
            }
          }
        }
      }
    }
  }
  p_top.sort(function(a,b) {
    return a.weight > b.weight ? -1 : a.weight < b.weight ? 1 : 0;
  });
  
  c_top.sort(function(a,b) {
    return a.weight > b.weight ? -1 : a.weight < b.weight ? 1 : 0;
  });
  // console.log(p_top)
  // console.log(c_top)
  // console.log(nodes);

  let total_weight_p = 0
  let total_weight_c = 0
  let reco = [];
  for (let s=0; s<5; s++){
    total_weight_p += p_top[s].weight
    total_weight_c += c_top[s].weight
  }
  for(let s=0; s<5; s++) {  
    let offset = 50;
    // console.log(graph[q]);
    let x = 1000*(Math.random() - 0.5)
    x = (x < 0) ? x - offset: x + offset;
    let y = 1000*(Math.random() - 0.5)
    y = (y < 0) ? y - offset: y + offset;
    nodes.push({id: p_top[s].position, value: p_top[s].weight / total_weight_p * 100, label: p_top[s].position, group: 2, x: x, y: y});
    nodes.push({id: c_top[s].company, value: 15, label: c_top[s].company, group: 3, x: x, y: y});
    for(let d in graph) {
      if(t_top.includes(d)) {
        edges.push({from: d, to: p_top[s].position, value:graph[d][p_top[s].position]});
        edges.push({from: d, to: c_top[s].company, value:graph[d][c_top[s].company]});
      }
    }
    for(let f=0; f<skill.length; f++) {
      if(skill[f].company.includes(c_top[s].company)) {
        reco.push({companyId: skill[f].companyId, logo: skill[f].logo_src, positionId: skill[f].positionId, company: c_top[s].company, position: skill[f].position});
      }
      if(reco.length == 2) {
        break;
      }
    }    
  }   

  // console.log(nodes);
  // console.log(edges);



/*
  for(let q in graph) {
    if(t_top.includes(q)) {
      // console.log(graph[q]);
      for(let w in graph[q]) {
        if(position_list.includes(w)) {
          p_top.push({position: w, weight: graph[q][w]});
        }
        if(company_list.includes(w)) {
          c_top.push({company: w, weight: graph[q][w]});
        }
      }
    }
  }

  p_top.sort(function(a,b) {
    return a.weight > b.weight ? -1 : a.weight < b.weight ? 1 : 0;
  });
  c_top.sort(function(a,b) {
    return a.weight > b.weight ? -1 : a.weight < b.weight ? 1 : 0;
  });
  console.log(p_top)
  console.log(c_top)
*/

  dataset_nodes = nodes
  dataset_edges = edges
  reco_data = reco
  // reco = reco
  // let nodes = [];
  // let edges = [];

  // for(let a=0; a<position_list.length; a++) {
  //   let offset = 250;
  //   let x = 1000*(Math.random() - 0.5)
  //   x = (x < 0) ? x - offset: x + offset;
  //   let y = 1000*(Math.random() - 0.5)
  //   y = (y < 0) ? y - offset: y + offset;
  //   nodes.push({id: position_list[a], value: 2, label: position_list[a], group: 1, x: x, y: y});
  // } 
  // for(let b = 0; b<tech_list.length; b++) {
  //   let value = Math.round(Math.random()+0.55)
  //   let offset = 250;
  //   let x = 500*(Math.random() - 0.5) + offset
  //   x = (x < 0 && value == 2) ? x - offset: x + offset;
  //   let y = 500*(Math.random() - 0.5) + offset
  //   y = (y < 0 && value == 2) ? y - offset: y + offset;
  //   nodes.push({id: tech_list[b], value: 1, label: tech_list[b], group: 2, x: x, y: y});
  // }

  // for(let c = 0; c<company_list.length; c++) {
  //   let value = Math.round(Math.random()+0.55)
  //   let offset = 250;
  //   let x = 500*(Math.random() - 0.5) - offset
  //   x = (x < 0 && value == 2) ? x - offset: x + offset;
  //   let y = 500*(Math.random() - 0.5) - offset
  //   y = (y < 0 && value == 2) ? y - offset: y + offset;
  //   nodes.push({id: company_list[c], value: 1, label: company_list[c], group: 3, x: x, y: y});
  // }

  // for(let f in graph) {
  //   for(let d in graph[f]) {
  //     edges.push({from: f, to: d, value: graph[f][d]});
  //   }
  // }
  // dataset_nodes = nodes
  // dataset_edges = edges
}

router.get('/dataset', async(req, res) => {
  res.json({
    nodes: dataset_nodes,
    edges: dataset_edges,
  });
})

// router.get('/recommend', async (req, res) => {
//   try {
//     var query = "SELECT "
//     query += "positions.position,companies.logo_src,companies.company,positions.positionId "
//     query += "from companies JOIN positions ON companies.companyId = positions.companyId order by rand() LIMIT 8"
//     var [random, _]= await con.query(query);
//   }catch(err) {
//     console.log(err);
//   }

//   res.render('recommend', {
//     companies: random
//   });
// });

router.get('/recommend', async(req, res) => {  // 얻어온 data
  if(req.query.data != null) {
    let tech = JSON.parse(decodeURIComponent(req.query.data));  // tech 변수에 string 객체를 json 객체로 변환
    console.log(tech)
  //let tech = JSON.parse(body);

  try {
    let query = "SELECT "
    query += "positions.position,companies.logo_src,companies.company,positions.positionId,positions.tech_stack,positions.career "
    query += "from companies JOIN positions ON companies.companyId = positions.companyId WHERE "
    query += `positions.tech_stack LIKE '%"${tech[0]}"%' `
    for(i=1; i<tech.length; i++) {
      query += `OR positions.tech_stack LIKE '%"${tech[i]}"%' ` // tech[i]인 data만 가져옴 AND => 다 속하는 거 OR => 속한거 다
    }
    var [random, _]= await con.query(query);  // random 함수에 query를 넣음
  }catch(err) {
    console.log(err);
  }

  res.render('recommend', {
    companies: random,
    tech: tech
  });

  }else {
      try {
    var query = "SELECT "
    query += "positions.position,companies.logo_src,companies.company,positions.positionId,positions.tech_stack,positions.career "
    query += "from companies JOIN positions ON companies.companyId = positions.companyId order by rand() LIMIT 8"
    var [random, _]= await con.query(query);
  }catch(err) {
    console.log(err);
  }

  res.render('recommend', {
    companies: random,
    tech: undefined
  });
  }
  
});

router.get('/require/:id', async (req, res) => {
  var id = req.params.id   // /require/1
  // var id = req.query.id // /require?id=1
  let data = req.query.data
  // let position = req.params.position
  // try{
    // let positionInfo = await con.query('SELECT `positionId`, `position`,`position_Info`,`requirement`,`preference` FROM final.positions WHERE positionId='+id);
    let query = "SELECT "
    query += "positionId, companies.company, positions.position, positions.position_Info, positions.requirement, positions.preference, positions.tech_stack "
    query += "FROM positions JOIN companies ON positions.companyId = companies.companyId WHERE positionId="+id
    // WHERE positionId="+id
    let positionInfo = await con.query(query)
    let info = positionInfo[0][0]
    // console.log(info);

    let position = info.position_Info
    let buff = Buffer.from(position, 'base64')
    let text = buff.toString('utf-8')
    positionInfo[0][0].position_Info = text

    let require = info.requirement
    let buff1 = Buffer.from(require, 'base64')
    let text1 = buff1.toString('utf-8')
    positionInfo[0][0].requirement = text1

    let pre = info.preference
    let buff2 = new Buffer.from(pre, 'base64')
    let text2 = buff2.toString('utf-8')
    positionInfo[0][0].preference = text2
  
  // }catch(err) {

  // }
  res.render('require', {
    id : req.params.id ,
    position_info: positionInfo[0][0],
    tech: data
  });

});

router.get('/', async (req, res) => {  
  try{
    // var[logos, column] = await con.query ( 'SELECT `companyId`,`logo_src` FROM final.companies' );
    var query = "SELECT "
        query += "positions.position,companies.logo_src,companies.company,positions.positionId,positions.tech_stack "
        query += "from companies JOIN positions ON companies.companyId = positions.companyId order by rand() LIMIT 6"
    var [random, _]= await con.query(query);
    // console.log(random)
    
  }catch(err) {
    console.log(err)
  }
  res.render('main.ejs', {
    companyRandom: random
  });
});

module.exports = router;