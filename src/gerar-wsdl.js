// Gera wsdl/streaming.wsdl (document/literal "wrapped", SOAP 1.1).
// Em SOAP o contrato (WSDL + XSD) é o artefato central; aqui ele é gerado a partir de uma descrição compacta.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NS = 'http://streaming.exemplo.com/';
const porta = process.env.PORT ?? 3004;

const tipos = {
  Usuario: [['id', 'int', 0], ['nome', 'string'], ['idade', 'int']],
  Musica: [['id', 'int', 0], ['nome', 'string'], ['artista', 'string']],
  Playlist: [['id', 'int', 0], ['nome', 'string'], ['usuarioId', 'int'], ['musicaId', 'int', 1, 'unbounded']],
};

// [operação, parâmetros de entrada, tipo de saída, saída é lista?]
const ops = [];
for (const [rec, T, plural] of [['Usuario', 'Usuario', 'Usuarios'], ['Musica', 'Musica', 'Musicas'], ['Playlist', 'Playlist', 'Playlists']]) {
  const campo = rec.toLowerCase();
  ops.push([`Listar${plural}`, [], T, true]);
  ops.push([`Obter${rec}`, [['id', 'int']], T, false]);
  ops.push([`Criar${rec}`, [[campo, T]], T, false]);
  ops.push([`Atualizar${rec}`, [['id', 'int'], [campo, T]], T, false]);
  ops.push([`Remover${rec}`, [['id', 'int']], 'boolean', false]);
}
ops.push(['ListarPlaylistsDoUsuario', [['usuarioId', 'int']], 'Playlist', true]);
ops.push(['ListarMusicasDaPlaylist', [['playlistId', 'int']], 'Musica', true]);
ops.push(['ListarPlaylistsDaMusica', [['musicaId', 'int']], 'Playlist', true]);

const ref = (t) => (tipos[t] ? `tns:${t}` : `xsd:${t}`);
const el = ([n, t, min = 1, max = 1]) => `<xsd:element name="${n}" type="${ref(t)}" minOccurs="${min}" maxOccurs="${max}"/>`;

let x = `<?xml version="1.0" encoding="UTF-8"?>
<wsdl:definitions name="StreamingService" targetNamespace="${NS}"
  xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:tns="${NS}">
  <wsdl:types>
    <xsd:schema targetNamespace="${NS}" elementFormDefault="qualified">
`;
for (const [n, campos] of Object.entries(tipos))
  x += `      <xsd:complexType name="${n}"><xsd:sequence>${campos.map(el).join('')}</xsd:sequence></xsd:complexType>\n`;
for (const [n, ent, saida, lista] of ops) {
  x += `      <xsd:element name="${n}"><xsd:complexType><xsd:sequence>${ent.map(el).join('')}</xsd:sequence></xsd:complexType></xsd:element>\n`;
  x += `      <xsd:element name="${n}Response"><xsd:complexType><xsd:sequence>${el(['resultado', saida, lista ? 0 : 1, lista ? 'unbounded' : 1])}</xsd:sequence></xsd:complexType></xsd:element>\n`;
}
x += `    </xsd:schema>\n  </wsdl:types>\n`;
for (const [n] of ops) {
  x += `  <wsdl:message name="${n}In"><wsdl:part name="parameters" element="tns:${n}"/></wsdl:message>\n`;
  x += `  <wsdl:message name="${n}Out"><wsdl:part name="parameters" element="tns:${n}Response"/></wsdl:message>\n`;
}
x += `  <wsdl:portType name="StreamingPortType">\n`;
for (const [n] of ops) x += `    <wsdl:operation name="${n}"><wsdl:input message="tns:${n}In"/><wsdl:output message="tns:${n}Out"/></wsdl:operation>\n`;
x += `  </wsdl:portType>\n  <wsdl:binding name="StreamingBinding" type="tns:StreamingPortType">\n    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>\n`;
for (const [n] of ops)
  x += `    <wsdl:operation name="${n}"><soap:operation soapAction="${NS}${n}"/><wsdl:input><soap:body use="literal"/></wsdl:input><wsdl:output><soap:body use="literal"/></wsdl:output></wsdl:operation>\n`;
x += `  </wsdl:binding>
  <wsdl:service name="StreamingService">
    <wsdl:port name="StreamingPort" binding="tns:StreamingBinding"><soap:address location="http://localhost:${porta}/soap"/></wsdl:port>
  </wsdl:service>
</wsdl:definitions>
`;
const destino = fileURLToPath(new URL('../wsdl/streaming.wsdl', import.meta.url));
writeFileSync(destino, x);
console.log(`WSDL gerado: ${destino} (${ops.length} operações, ${x.length} bytes)`);
