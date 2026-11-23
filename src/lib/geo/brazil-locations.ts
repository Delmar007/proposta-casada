export interface BrazilianStateCities {
  uf: string;
  name: string;
  cities: string[];
}

export const BRAZIL_STATES: BrazilianStateCities[] = [
  {
    uf: 'AC',
    name: 'Acre',
    cities: [
      'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó',
      'Brasiléia', 'Senador Guiomard', 'Plácido de Castro', 'Xapuri', 'Mâncio Lima',
      'Epitaciolândia', 'Marechal Thaumaturgo', 'Porto Acre', 'Rodrigues Alves',
      'Acrelândia', 'Bujari', 'Capixaba', 'Jordão', 'Manoel Urbano', 'Porto Walter',
      'Santa Rosa do Purus', 'Assis Brasil',
    ],
  },
  {
    uf: 'AL',
    name: 'Alagoas',
    cities: [
      'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares',
      'Penedo', 'São Miguel dos Campos', 'Coruripe', 'Marechal Deodoro', 'Delmiro Gouveia',
      'Campo Alegre', 'Santana do Ipanema', 'Atalaia', 'Teotônio Vilela', 'Girau do Ponciano',
      'Pilar', 'São Sebastião', 'São Luís do Quitunde', 'Maragogi', 'Viçosa',
      'Murici', 'Craíbas', 'Junqueiro', 'Boca da Mata', 'Traipu',
      'Porto Calvo', 'Matriz de Camaragibe', 'Pão de Açúcar', 'Igaci', 'Lagoa da Canoa',
    ],
  },
  {
    uf: 'AP',
    name: 'Amapá',
    cities: [
      'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão',
      'Porto Grande', 'Tartarugalzinho', 'Pedra Branca do Amapari', 'Vitória do Jari',
      'Calçoene', 'Amapá', 'Ferreira Gomes', 'Cutias', 'Itaubal', 'Serra do Navio', 'Pracuúba',
    ],
  },
  {
    uf: 'AM',
    name: 'Amazonas',
    cities: [
      'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari',
      'Tabatinga', 'Maués', 'Tefé', 'Manicoré', 'Humaitá',
      'Iranduba', 'Lábrea', 'São Gabriel da Cachoeira', 'Benjamin Constant', 'Borba',
      'Autazes', 'São Paulo de Olivença', 'Careiro', 'Nova Olinda do Norte', 'Presidente Figueiredo',
      'Eirunepé', 'Boca do Acre', 'Rio Preto da Eva', 'Manaquiri', 'Barreirinha',
      'Ipixuna', 'Carauari', 'Novo Aripuanã', 'Fonte Boa', 'Barcelos',
    ],
  },
  {
    uf: 'BA',
    name: 'Bahia',
    cities: [
      'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro',
      'Lauro de Freitas', 'Itabuna', 'Ilhéus', 'Porto Seguro', 'Barreiras',
      'Jequié', 'Alagoinhas', 'Teixeira de Freitas', 'Simões Filho', 'Paulo Afonso',
      'Eunápolis', 'Santo Antônio de Jesus', 'Valença', 'Luís Eduardo Magalhães', 'Candeias',
      'Guanambi', 'Jacobina', 'Serrinha', 'Senhor do Bonfim', 'Dias d’Ávila',
      'Itapetinga', 'Irecê', 'Campo Formoso', 'Casa Nova', 'Brumado',
    ],
  },
  {
    uf: 'CE',
    name: 'Ceará',
    cities: [
      'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
      'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá',
      'Pacatuba', 'Aquiraz', 'Quixeramobim', 'Canindé', 'Russas',
      'Crateús', 'Tianguá', 'Aracati', 'Cascavel', 'Pacajus',
      'Icó', 'Horizonte', 'Camocim', 'Morada Nova', 'Acaraú',
      'Viçosa do Ceará', 'Barbalha', 'Limoeiro do Norte', 'Tauá', 'Trairi',
    ],
  },
  {
    uf: 'DF',
    name: 'Distrito Federal',
    cities: [
      'Brasília', 'Ceilândia', 'Samambaia', 'Taguatinga', 'Plano Piloto',
      'Planaltina', 'Águas Claras', 'Recanto das Emas', 'Gama', 'Guará',
      'Santa Maria', 'Sobradinho', 'São Sebastião', 'Vicente Pires', 'Itapoã',
      'Sol Nascente/Pôr do Sol', 'Brazlândia', 'Riacho Fundo II', 'Paranoá', 'Sobradinho II',
      'Jardim Botânico', 'Riacho Fundo', 'Núcleo Bandeirante', 'Cruzeiro', 'Sudoeste/Octogonal',
      'Lago Norte', 'Lago Sul', 'Park Way', 'Candangolândia', 'Varjão',
    ],
  },
  {
    uf: 'ES',
    name: 'Espírito Santo',
    cities: [
      'Serra', 'Vila Velha', 'Cariacica', 'Vitória', 'Cachoeiro de Itapemirim',
      'Linhares', 'São Mateus', 'Guarapari', 'Colatina', 'Aracruz',
      'Viana', 'Nova Venécia', 'Barra de São Francisco', 'Santa Maria de Jetibá', 'Marataízes',
      'Castelo', 'Itapemirim', 'Domingos Martins', 'Baixo Guandu', 'Alegre',
      'Afonso Cláudio', 'Anchieta', 'Sooretama', 'Jaguaré', 'Iúna',
      'Piúma', 'Venda Nova do Imigrante', 'Conceição da Barra', 'Guaçuí', 'Mimoso do Sul',
    ],
  },
  {
    uf: 'GO',
    name: 'Goiás',
    cities: [
      'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Águas Lindas de Goiás',
      'Luziânia', 'Valparaíso de Goiás', 'Senador Canedo', 'Trindade', 'Formosa',
      'Novo Gama', 'Catalão', 'Itumbiara', 'Jataí', 'Planaltina',
      'Caldas Novas', 'Santo Antônio do Descoberto', 'Goianésia', 'Cidade Ocidental', 'Mineiros',
      'Cristalina', 'Inhumas', 'Jaraguá', 'Quirinópolis', 'Niquelândia',
      'Morrinhos', 'Porangatu', 'Goianira', 'Itaberaí', 'Uruaçu',
    ],
  },
  {
    uf: 'MA',
    name: 'Maranhão',
    cities: [
      'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias',
      'Paço do Lumiar', 'Codó', 'Açailândia', 'Bacabal', 'Balsas',
      'Santa Inês', 'Barra do Corda', 'Pinheiro', 'Chapadinha', 'Santa Luzia',
      'Buriticupu', 'Grajaú', 'Itapecuru Mirim', 'Coroatá', 'Barreirinhas',
      'Tutóia', 'Zé Doca', 'Vargem Grande', 'Coelho Neto', 'Presidente Dutra',
      'Raposa', 'Viana', 'São Mateus do Maranhão', 'Tuntum', 'Pedreiras',
    ],
  },
  {
    uf: 'MT',
    name: 'Mato Grosso',
    cities: [
      'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
      'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste', 'Barra do Garças',
      'Alta Floresta', 'Nova Mutum', 'Pontes e Lacerda', 'Juína', 'Campo Novo do Parecis',
      'Peixoto de Azevedo', 'Colniza', 'Campo Verde', 'Juara', 'Guarantã do Norte',
      'Barra do Bugres', 'Poconé', 'Confresa', 'Mirassol d’Oeste', 'Jaciara',
      'Sapezal', 'Água Boa', 'Canarana', 'Chapada dos Guimarães', 'Paranatinga',
    ],
  },
  {
    uf: 'MS',
    name: 'Mato Grosso do Sul',
    cities: [
      'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
      'Sidrolândia', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Maracaju',
      'Paranaíba', 'Amambai', 'Rio Brilhante', 'Coxim', 'Chapadão do Sul',
      'Caarapó', 'São Gabriel do Oeste', 'Ivinhema', 'Aparecida do Taboado', 'Costa Rica',
      'Itaporã', 'Anastácio', 'Bonito', 'Jardim', 'Ribas do Rio Pardo',
      'Miranda', 'Bataguassu', 'Cassilândia', 'Nova Alvorada do Sul', 'Fátima do Sul',
    ],
  },
  {
    uf: 'MG',
    name: 'Minas Gerais',
    cities: [
      'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
      'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga',
      'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas',
      'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará',
      'Varginha', 'Vespasiano', 'Conselheiro Lafaiete', 'Itabira', 'Araguari',
      'Ubá', 'Passos', 'Coronel Fabriciano', 'Muriaé', 'Nova Lima',
    ],
  },
  {
    uf: 'PA',
    name: 'Pará',
    cities: [
      'Belém', 'Ananindeua', 'Santarém', 'Parauapebas', 'Marabá',
      'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'Bragança',
      'São Félix do Xingu', 'Barcarena', 'Altamira', 'Tucuruí', 'Paragominas',
      'Tailândia', 'Breves', 'Itaituba', 'Redenção', 'Moju',
      'Novo Repartimento', 'Canaã dos Carajás', 'Oriximiná', 'Santa Izabel do Pará', 'Capanema',
      'Benevides', 'Tomé-Açu', 'Igarapé-Miri', 'Viseu', 'Monte Alegre',
    ],
  },
  {
    uf: 'PB',
    name: 'Paraíba',
    cities: [
      'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux',
      'Sousa', 'Cabedelo', 'Cajazeiras', 'Guarabira', 'Sapé',
      'Mamanguape', 'Queimadas', 'Monteiro', 'Esperança', 'Pombal',
      'São Bento', 'Catolé do Rocha', 'Alagoa Grande', 'Pedras de Fogo', 'Lagoa Seca',
      'Solânea', 'Itabaiana', 'Conde', 'Alhandra', 'Rio Tinto',
      'Areia', 'Bananeiras', 'Mari', 'Cuité', 'Princesa Isabel',
    ],
  },
  {
    uf: 'PR',
    name: 'Paraná',
    cities: [
      'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
      'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá',
      'Araucária', 'Toledo', 'Apucarana', 'Campo Largo', 'Pinhais',
      'Arapongas', 'Almirante Tamandaré', 'Piraquara', 'Umuarama', 'Cambé',
      'Fazenda Rio Grande', 'Sarandi', 'Campo Mourão', 'Francisco Beltrão', 'Paranavaí',
      'Pato Branco', 'Cianorte', 'Telêmaco Borba', 'Castro', 'Rolândia',
    ],
  },
  {
    uf: 'PE',
    name: 'Pernambuco',
    cities: [
      'Recife', 'Jaboatão dos Guararapes', 'Petrolina', 'Caruaru', 'Olinda',
      'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão',
      'Igarassu', 'São Lourenço da Mata', 'Abreu e Lima', 'Santa Cruz do Capibaribe', 'Ipojuca',
      'Serra Talhada', 'Araripina', 'Gravatá', 'Carpina', 'Goiana',
      'Belo Jardim', 'Arcoverde', 'Ouricuri', 'Escada', 'Pesqueira',
      'Surubim', 'Palmares', 'Moreno', 'Salgueiro', 'Bezerros',
    ],
  },
  {
    uf: 'PI',
    name: 'Piauí',
    cities: [
      'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano',
      'Barras', 'Campo Maior', 'União', 'Altos', 'Esperantina',
      'José de Freitas', 'Pedro II', 'Oeiras', 'São Raimundo Nonato', 'Miguel Alves',
      'Luís Correia', 'Batalha', 'Corrente', 'Bom Jesus', 'Uruçuí',
      'Valença do Piauí', 'Cocal', 'Luzilândia', 'Paulistana', 'Piracuruca',
      'Água Branca', 'Amarante', 'Jaicós', 'Inhuma', 'Simões',
    ],
  },
  {
    uf: 'RJ',
    name: 'Rio de Janeiro',
    cities: [
      'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Campos dos Goytacazes',
      'Belford Roxo', 'Niterói', 'São João de Meriti', 'Petrópolis', 'Volta Redonda',
      'Macaé', 'Magé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis',
      'Maricá', 'Nova Friburgo', 'Barra Mansa', 'Teresópolis', 'Mesquita',
      'Nilópolis', 'Rio das Ostras', 'Queimados', 'Itaguaí', 'Araruama',
      'Resende', 'Japeri', 'São Pedro da Aldeia', 'Itaperuna', 'Barra do Piraí',
    ],
  },
  {
    uf: 'RN',
    name: 'Rio Grande do Norte',
    cities: [
      'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba',
      'Ceará-Mirim', 'Extremoz', 'Caicó', 'Assú', 'São José de Mipibu',
      'Currais Novos', 'Santa Cruz', 'Nova Cruz', 'Apodi', 'João Câmara',
      'Canguaretama', 'Touros', 'Macau', 'Pau dos Ferros', 'Nísia Floresta',
      'Areia Branca', 'Goianinha', 'Baraúna', 'Santo Antônio', 'Monte Alegre',
      'São Miguel', 'Tibau do Sul', 'Vera Cruz', 'Parelhas', 'Caraúbas',
    ],
  },
  {
    uf: 'RS',
    name: 'Rio Grande do Sul',
    cities: [
      'Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria',
      'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande',
      'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Santa Cruz do Sul', 'Cachoeirinha',
      'Uruguaiana', 'Bento Gonçalves', 'Bagé', 'Erechim', 'Guaíba',
      'Lajeado', 'Ijuí', 'Cachoeira do Sul', 'Esteio', 'Sapiranga',
      'Santana do Livramento', 'Farroupilha', 'Alegrete', 'Venâncio Aires', 'Vacaria',
    ],
  },
  {
    uf: 'RO',
    name: 'Rondônia',
    cities: [
      'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal',
      'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Machadinho d’Oeste', 'Buritis',
      'Pimenta Bueno', 'Ouro Preto do Oeste', 'Espigão d’Oeste', 'Nova Mamoré', 'Candeias do Jamari',
      'Alta Floresta d’Oeste', 'São Miguel do Guaporé', 'Presidente Médici', 'Nova Brasilândia d’Oeste',
      'Cerejeiras', 'Colorado do Oeste', 'Alvorada d’Oeste', 'São Francisco do Guaporé', 'Costa Marques',
      'Itapuã do Oeste', 'Monte Negro', 'Urupá', 'Chupinguaia', 'Seringueiras', 'Mirante da Serra',
    ],
  },
  {
    uf: 'RR',
    name: 'Roraima',
    cities: [
      'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre', 'Mucajaí',
      'Cantá', 'Pacaraima', 'Amajari', 'Bonfim', 'Iracema',
      'Normandia', 'Uiramutã', 'São João da Baliza', 'Caroebe', 'São Luiz',
    ],
  },
  {
    uf: 'SC',
    name: 'Santa Catarina',
    cities: [
      'Joinville', 'Florianópolis', 'Blumenau', 'São José', 'Itajaí',
      'Chapecó', 'Palhoça', 'Criciúma', 'Jaraguá do Sul', 'Lages',
      'Balneário Camboriú', 'Brusque', 'Tubarão', 'Camboriú', 'Navegantes',
      'São Bento do Sul', 'Concórdia', 'Itapema', 'Biguaçu', 'Caçador',
      'Rio do Sul', 'Indaial', 'Araranguá', 'Gaspar', 'Mafra',
      'Içara', 'Videira', 'Canoinhas', 'Tijucas', 'Imbituba',
    ],
  },
  {
    uf: 'SP',
    name: 'São Paulo',
    cities: [
      'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André',
      'Osasco', 'Sorocaba', 'Ribeirão Preto', 'São José dos Campos', 'São José do Rio Preto',
      'Mogi das Cruzes', 'Jundiaí', 'Piracicaba', 'Santos', 'Mauá',
      'Diadema', 'Carapicuíba', 'Bauru', 'Itaquaquecetuba', 'São Vicente',
      'Franca', 'Praia Grande', 'Guarujá', 'Taubaté', 'Limeira',
      'Suzano', 'Taboão da Serra', 'Sumaré', 'Barueri', 'Embu das Artes',
    ],
  },
  {
    uf: 'SE',
    name: 'Sergipe',
    cities: [
      'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão',
      'Estância', 'Tobias Barreto', 'Barra dos Coqueiros', 'Itabaianinha', 'Simão Dias',
      'Nossa Senhora da Glória', 'Poço Redondo', 'Capela', 'Propriá', 'Laranjeiras',
      'Boquim', 'Umbaúba', 'Canindé de São Francisco', 'Nossa Senhora das Dores', 'Poço Verde',
      'Carira', 'Neópolis', 'Aquidabã', 'Riachão do Dantas', 'Ribeirópolis',
      'Itaporanga d’Ajuda', 'Estância', 'Maruim', 'Carmópolis', 'Salgado',
    ],
  },
  {
    uf: 'TO',
    name: 'Tocantins',
    cities: [
      'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
      'Araguatins', 'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis', 'Dianópolis',
      'Formoso do Araguaia', 'Miracema do Tocantins', 'Augustinópolis', 'Lagoa da Confusão',
      'Pedro Afonso', 'Taguatinga', 'Xambioá', 'Miranorte', 'Goiatins', 'São Miguel do Tocantins',
      'Sítio Novo do Tocantins', 'Ananás', 'Natividade', 'Buriti do Tocantins', 'Alvorada',
      'Axixá do Tocantins', 'Arraias', 'Cristalândia', 'Peixe', 'Wanderlândia',
    ],
  },
];

export function getCitiesByUF(uf: string): string[] {
  return BRAZIL_STATES.find((s) => s.uf === uf)?.cities ?? [];
}
