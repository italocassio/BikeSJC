var map;
var login = "";
var latlong = "";
var baseURL = "http://bikesjc.azurewebsites.net/";
//var baseURL = "http://localhost:56568/";
var sjc = { lat: -23.1899556, lng: -45.86557 };
var estacoes = [];

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'. 
    bindEvents: function() {
        document.addEventListener('offline', this.offLine, false);
        document.addEventListener('deviceready', this.onDeviceReady, false);         
    },
    // deviceready Event Handler
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {        
        //carrega as estações
        mapaEstacao();

        //login automático, se já logado antes
        if (localStorage.getItem('usuario') != null && localStorage.getItem('senha') != null) {
            $("#txtLogin").val(localStorage.getItem('usuario'));
            $("#txtSenha").val(localStorage.getItem('senha'));
            AcessarLogin();            
        }
        //função do botão voltar
        document.addEventListener('backbutton', onBackKeyDown, false);
    },

    offLine: function () {
        swal('Atenção!','Você está offline! Verifique sua conexão.','error');        
    }
};

function onBackKeyDown() {
    if (localStorage.getItem('usuario') == null) {
        navigator.app.exitApp();
    } else {
        //se estiver na home ou no cadastro, sair do app
        if ($('#divLogin').css('display') == 'block') {
            navigator.app.exitApp();
        } else if ($('#divComoFunciona').css('display') == 'block') {
            acessar('divLogin');
        }
        else {
            entrar('divMaster', 'mapa');
        }
        
    }
            
}

function mapaEstacao() {

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: sjc
    });

    //estacoes = retornaEstacoes(); //obtemos as estações
   
}

function atualizaEstacoes() {
    estacoes = retornaEstacoes(); //obtemos as estações
}

function acessar(div) {
    $(".divPage").hide(); //esconde todas as divs
	if (div != 'divMaster'){
        $("#mapaestacoes, #divMapaRota").hide();
	} else {
		$('#hfmapa').click();
		$('ul.tabs').tabs('select_tab', 'hfmapa');
		$("#mapaestacoes").show();
	}	
    $("#btnVoltarEstacao").hide();
    if (div == "divPasses") {
        retornaPasseAtivo();
    }
    $("#" + div).show();        
}

function entrar(div, tab) {
	$(".divPage").hide();
    $("#divLogin").hide();
    $("#btnVoltarEstacao, #right-panel").hide();
    $("#mapaestacoes").show();
    $("#" + div).show();
    $("#hf" + tab).click();
    $(".menuLogado").show();

    if (tab == "bike") {
        retornaBikeUso();
    }
    
    //resgata a localização do usuário
    navigator.geolocation.getCurrentPosition(function(position) {
              
        latlong = { lat: position.coords.latitude, lng: position.coords.longitude };
        var latlng = position.coords.latitude + "," + position.coords.longitude;
        estacoes = retornaEstacoes(latlng); //obtemos as estações   
        
        var marker = new google.maps.Marker({
          position: latlong,
          map: map
        });

        map.setCenter(latlong); //centraliza o mapa na localização atual
                       
                
    }, function(error) {
           if(error.code == PositionError.PERMISSION_DENIED) {
                      alert("Sem permissão para utilizar o GPS!");
           } else if(error.code == PositionError.POSITION_UNAVAILABLE) {
                      alert("GPS não encontrado!");
           } else if(error.code == PositionError.TIMEOUT) {
                      alert("Está demorando para obter localização!");
           } else {
                      alert("Erro desconhecido no GPS!");
           }
    }, { enableHighAccuracy: true, maximumAge: 9999999 });         
       
    
        
}

function retornaEstacoes(latlng) {
    var arrEstacao = [];

    if (latlng == null) {
        latlng = latlong;
    }

    $.ajax({
        type: "GET",
        url: baseURL + "/Estacao?loc=" + latlng,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            //console.log(response);
            var e = response;
            
            e.forEach(estacao => {
                //registra as localizações das estações
                var modeloEstacao =
                    {
                        position: new google.maps.LatLng(estacao.est_latitude, estacao.est_longitude),
                        type: 'parking',
                        latlng: "" + estacao.est_latitude + ", " + estacao.est_longitude + "",
                        nome: estacao.est_nome,
                        id: estacao.est_id
                    }
                //adiciona no array de  estacao
                arrEstacao.push(modeloEstacao);
            });

            //colocamos  uma pausa por causa do retorno do ajax e renderização do mapa, caso contrário não plota.
            setTimeout(function () {
                // Cria os marcadores com base nas localizações das estações.
                estacoes.forEach(function (estacao) {
                    var marker = new google.maps.Marker({
                        position: estacao.position,
                        map: map,
                        icon: 'img/estation.png'
                    });
                    // ao clicar no marcador, exibe os detalhes da estação
                    marker.addListener('click', function () {
                        infoEstacao(estacao.latlng, estacao.nome, estacao.id);
                    });
                });
            }, 1200);

            //monta lista das estações
            var html = "";
            e.forEach(estacao => {
                var latlngEst = "" + estacao.est_latitude + ", " + estacao.est_longitude + "";
                html += `<div class="card" onclick="infoEstacao(\'${latlngEst}\', \'${estacao.est_nome}\', \'${estacao.est_id}\');">
                          <div class="row">
                              <div class="col s2"><img src="img/estation.png" style="padding: 15px;"></div>
                              <div class="col s2" style="padding-top: 12px;">${estacao.est_distancia}</div>
                              <div class="col s8" style="padding-top: 12px;">
                                  <span><b>${estacao.est_nome}</b></span><br>
                                  <span>${estacao.est_num_bikes_atual} bike(s) - ${estacao.est_travas_disponiveis} vaga(s)</span>
                              </div>
                          </div>
                      </div>`;
            });

            $.each(e, function (i, item) {
                if (item.est_travas_disponiveis != 0) {
                    $('#ddlEstacao').append($('<option>', {
                        value: item.est_id,
                        text: item.est_nome
                    }));
                }                
            });

            $("#estacoes").html(html);

            //atualização de planos
            verificarAtualizarPlanoAtivos(localStorage.getItem('usuId'));
        },
        failure: function (response) {
            console.log('falhou');
        },
        error: function (response) {
            console.log('errou');
        }
    });

    return arrEstacao;
    
}

function retDistEstacaoXUsuario(latlngEst) {
    var distancia = "0";

    $.ajax({
        type: "GET",
        url: "http://localhost:56568/Estacao/distancia", //`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${latlong}&destinations=${latlngEst}&mode=bicycling&language=pt-BR&key=AIzaSyDSND8hdK0WR_QXRFfqPPDstJz4OCMDI3w `,
        success: function (response) {            
            var dados = response;
            console.log('asd:' + dados.rows[0].elements[0].distance.text);
            distancia = dados.rows[0].elements[0].distance.text;
        },
        failure: function (response) {
            swal('Oops', 'Algo deu errado ao carregar histórico1.', 'error');
        },
        error: function (response) {
            swal('Oops', 'Algo deu errado ao carregar histórico2.', 'error');
        }
    });

    return distancia;

}
//exibe detalhes da estação e cria botao ver rotas
function infoEstacao(latlng, nome, id) {
    $("#numBikes, #numVagas").html("");
    $(".fa-spin").show();
    $("#tituloEstacao").html(nome);
    $('#modal1').modal('open');
    $("#openMaps").attr("href", "geo:" + latlng);
    var htmlFooter = "";
    $.ajax({
        type: "GET",
        url: baseURL + "/Estacao/info?id=" + id,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {           
            var dados = JSON.parse(response);
            $(".fa-spin").hide();
            $("#numBikes").html(dados.bicicletas);
            $("#numVagas").html(dados.vagas);
           
            if (dados.bicicletas > 0) {
                htmlFooter += '<button type="button" class="waves-effect waves-light btn  blue darken-1" onclick="solicitarBike(' + id + ');">retirar bike</button> ';
            }
            htmlFooter += '<button class="modal-action modal-close waves-effect waves-green btn-flat" onclick="verRota(' + latlng + ');" >Rota</button>';
            $("#footModalRotas").html(htmlFooter);

        },
        failure: function (response) {
            swal('Oops', 'Algo deu errado.','error');
        },
        error: function (response) {
            swal('Oops', 'Algo deu errado.', 'error');
        }
    });
       
}

function esconderHistorico() {
    $("#divHistorico").hide();
    $('#btnEscondeHistorico').hide();
    $('#btnCarregarHistorico').text('Exibir histórico').attr("disabled", false).show();   
}

function carregarHistorico() {
      
    $.ajax({
        type: "GET",
        url: baseURL + "Usuario/historico",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: `usuario=${localStorage.getItem('usuId')}`,
        beforeSend: function () {
            $('#btnCarregarHistorico').text('carregando...').attr("disabled", true); 
        },
        success: function (response) {           
            var d = response;
            var html = "";
            $('#btnCarregarHistorico').hide();
            $('#btnEscondeHistorico').show();
            d.forEach(item => {
                html += `<div class="card">
                          <div class="row">
                              <div class="col s12" style="color:#0a61b9;">
                                   <div style="padding:5px;">
                                   <span><i class="fa fa-calendar" aria-hidden="true"></i> ${item.dataRetirada}</span><br>    
                                   <span><i class="fa fa-map-marker" aria-hidden="true"></i> ${item.estacaoR} até ${item.estacaoE}</span><br>  
                                   <span><i class="fa fa-clock-o" aria-hidden="true"></i> <b>${item.tempo}</b></span>
                                   </div>
                              </div>
                          </div>
                      </div>`;
            });
            $("#loaderHistorico").hide();
            $("#divHistorico").html(html).show();
        },
        failure: function (response) {            
            $("#loaderHistorico").hide();
            swal('Oops', 'Algo deu errado ao carregar histórico1.', 'error');
        },
        error: function (response) {
            $("#loaderHistorico").hide();
            swal('Oops', 'Algo deu errado ao carregar histórico2.', 'error');
        }
    });
}

function solicitarBike(estacao) {
    navigator.vibrate(1000);
    swal({
        title: 'Atenção!',
        text: 'Deseja retirar uma bike desta estação?',
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim",
        cancelButtonText: "Não",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $("#loader").show();
                $.ajax({
                    type: "POST",
                    url: baseURL + "/Bicicleta/solicitar",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: "{voucher:" + localStorage.getItem('voucher') + ", estacao:" + estacao + "}",
                    success: function (response) {
                        $("#loader").hide();
                        if (response == "liberada") {
                            swal({
                                title: "UHUUU!",
                                text: "Sua bike está disponível!",
                                type: "success",
                                showCancelButton: false,
                                confirmButtonText: "Ver minha bike para retirar.",
                                cancelButtonText: "Não",
                                closeOnConfirm: true,
                                closeOnCancel: true
                            },
                                function (isConfirm) {
                                    if (isConfirm) {
                                        $("#modal1").modal('close');
                                        entrar('divMaster', 'bike');                                        
                                    }
                                }
                            );
                        } else if (response == "Contrate um plano para alugar a bike."){

                            swal({
                                title: "Seu plano Expirou!",
                                text: response,
                                type: "error",
                                showCancelButton: false,
                                confirmButtonText: "Comprar",
                                cancelButtonText: "Não",
                                closeOnConfirm: true,
                                closeOnCancel: true
                            },
                                function (isConfirm) {
                                    if (isConfirm) {
                                        $("#modal1").modal('close');
                                        acessar('divPasses');
                                    }
                                }
                            );
                            
                        } else {
                            console.log(response);
                        }

                    },
                    failure: function (response) {
                        $("#loader").hide();
                        swal('Oops', 'Algo deu errado ao solicitar bike1.', 'error');
                    },
                    error: function (response) {
                        $("#loader").hide();
                        swal('Oops', 'Algo deu errado ao solicitar bike2.', 'error');
                    }
                });

            }
        });

}

function retornaBikeUso() {
        

    if (localStorage.getItem('planoIdAtivo') == null) {
        retornaPasseAtivo();
        return false;
    }


    $.ajax({
        type: "GET",
        url: baseURL + "/Bicicleta/utilizando?pna=" + localStorage.getItem('planoIdAtivo'),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            var html = "";
            if (response == "Nenhuma") {
                html = `<div class="row">
                        <div class="col s12 m6">
                          <div class="card">
                            <div class="card-content white-text" style="text-align:center;">
                              <i class="fa fa-meh-o blue-text fa-3x" aria-hidden="true"></i>
                              <p class="blue-text card-title"> Nenhum Passeio em Progresso</p>                                                           
                            </div>                            
                          </div>
                        </div>
                      </div>`;
            } else {
                var dados = JSON.parse(response);
                localStorage.setItem('solicitacao', dados.solicitacaoId);
                localStorage.setItem('bikeUso', dados.bike);
                html = `<div class="row">
                        <div class="col s12 m6">
                          <div class="card">
                            <div class="card-content white-text" style="text-align:center;">
                              <p class="blue-text"><i class="fa fa-bicycle" aria-hidden="true"></i> Passeio em Progresso</p>
                              <p class="green-text">Número da sua bike: <b>${dados.bike}</b><p/>
                              <p class="blue-grey-text" style="margin-bottom:10px;" >Início em: <b>${dados.estacao}</b><p/>                              
                              <span style="font-size:30px" class="card-title blue-text">${dados.tempo}</span>    
                              <span style="color:#989898;">última atualização:${dados.agora}</span>                              
                            </div>
                            <div style="padding-bottom:10px;display: flex; align-items: center; justify-content: center;">
                                <button type="button" class="waves-effect waves-light btn  amber lighten-1" style="margin-right:15px;" onclick="retornaBikeUso();"><i class="fa fa-refresh" aria-hidden="true"></i> atualizar</button>
                                <button type="button" class="waves-effect waves-light btn  blue darken-1" onclick="entregarBike(${dados.solicitacaoId}, ${dados.estacaoId}, ${dados.bike});"><i class="fa fa-check-circle-o" aria-hidden="true"></i> Finalizar</button>
                            </div>
                          </div>
                        </div>
                      </div>`;
            }

            $("#conteudobike").html(html);                       
            $("#loader").hide();
        },
        failure: function (response) {
            $("#loader").hide();
            swal('Oops', 'Algo deu errado ao retornar bike uso1.', 'error');
        },
        error: function (response) {
            $("#loader").hide();
            swal('Oops', 'Algo deu errado ao retornar bike uso2.', 'error');
        }
    });
    
}

function entregarBike() {
    navigator.vibrate(1000);
    swal({
        title: 'Atenção!',
        text: 'Deseja finalizar seu passeio?',
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim",
        cancelButtonText: "Não",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $("#modal2").modal('open');
                $('select').material_select();  
            }
        });
    
}

function finalizarEntregaBike() {
    if ($('#ddlEstacao').val() == null) {
        swal('Atenção!', 'Selecione uma estação.', 'warning');
        return false;
    }
    $("#loader").show();
    $.ajax({
        type: "POST",
        url: baseURL + "Bicicleta/entregar",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: `{solicitacaoId:${localStorage.getItem('solicitacao')}, estacao:${$('#ddlEstacao').val()}, bike:${localStorage.getItem('bikeUso')}`,
        success: function (response) {
            $("#loader").hide();
            var d = response;
            if (d.execucao = 1) {
                $("#modal2").modal('close');
                swal('Obrigado!', d.msg, 'success');
                retornaBikeUso();
                atualizaEstacoes();
            } else {
                swal('Oops', d.msg, 'error');
            }
        },
        failure: function (response) {
            $("#loader").hide();
            alert(response.d);
        },
        error: function (response) {
            $("#loader").hide();
            alert(response.d);
        }
    });
}

//exibe a rota no mapa do local atual com a estação
function verRota(lat,long) {
       
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer;
       
        var map = new google.maps.Map(document.getElementById('mapRota'), {
            zoom: 10,
            center: sjc
        });

        directionsService.route({
          origin: latlong,
          destination: lat +","+long,
          travelMode: 'DRIVING'
        }, function(response, status) {
          if (status === 'OK') {
            directionsDisplay.setDirections(response);
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });

        directionsDisplay.setMap(map);
        directionsDisplay.setPanel(document.getElementById('right-panel'));
        $("#mapaestacoes").hide();
        $("#divMapaRota, #btnVoltarEstacao, #right-panel").show();
		$('#modal1').modal('close');
        
}

function voltarEstacao() {
    $("#mapaestacoes").show();
    $("#divMapaRota").hide();
}

function comprarPasse(passe) {
    var msg, titulo;

    switch (passe) {
        case 1:
            titulo = "Deseja adquirir Passe Diário?";
            msg = "Serão descontados 2 reais do seu saldo.";
            break;
        case 2:
            titulo = "Deseja adquirir Passe Mensal?";
            msg = "Serão descontados 20 reais do seu saldo.";
            break;
        case 3:
            titulo = "Deseja adquirir Passe Anual?";
            msg = "Serão descontados 200 reais do seu saldo.";
            break;
    }
    navigator.vibrate(1000);
    swal({
      title: titulo,
      text: msg,
      type: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim",
      cancelButtonText: "Não",
      closeOnConfirm: true,
      closeOnCancel: true
    },
    function(isConfirm){
        if (isConfirm) {
            $("#loader").show();
            $.ajax({
                type: "POST",
                url: baseURL + "/Plano/comprar",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: "{usuarioId:" + localStorage.getItem('usuId') +", planoId:" + passe + "}",
                success: function (response) {
                    $("#loader").hide();
                    retornaSaldo();
                    if (response == "ok") {
                        swal({
                            title: "Parabéns!",
                            text: "Comprar realizada!",
                            type: "success",
                            showCancelButton: false,
                            confirmButtonText: "Sim",
                            cancelButtonText: "Não",
                            closeOnConfirm: true,
                            closeOnCancel: true
                        },
                            function (isConfirm) {
                                if (isConfirm) {
                                    acessar('divPasses');
                                }
                            }
                        );
                    }
                    
                },
                failure: function (response) {
                    $("#loader").hide();
                    alert(response.d);
                },
                error: function (response) {
                    $("#loader").hide();
                    alert(response.d);
                }
            });
       
      }
    });
}

function AcessarLogin () {
  
  if($("#txtLogin").val() == "") {
       swal("Atenção!", "Preenche o campo login.", "warning");
       return false;
  }

  if($("#txtSenha").val() == "") {
       swal("Atenção!", "Preenche o campo senha.", "warning");
       return false;
  }

  $("#loader").show();

  var objDados = {
    usuario: $("#txtLogin").val() , 
    senha: $("#txtSenha").val()
  }

  $.ajax({
          type: "POST",
          url: baseURL + "/Usuario/login",
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data: JSON.stringify(objDados),
          success: function (response) {
            $("#loader").hide();
            var usuario = response;
            
            if(usuario.nome == null) {
                swal('Atenção!', 'login ou senha incorretos.', 'error')
            } else {
                localStorage.setItem('usuario', usuario.usuario);
                localStorage.setItem('senha', usuario.senha);
                localStorage.setItem('nome', usuario.nome);
                localStorage.setItem('usuId', usuario.id);               
                $("#spNome").html("Olá, " + usuario.nome);
                $("#spSaldo, #spSaldoAtu").html("Seu Saldo: R$ " + usuario.credito + ",00");                
                Materialize.toast('Seja bem vindo ' + usuario.nome, 4000);
                entrar('divMaster', 'mapa');
                retornaPasseAtivo();
            }
            
          },
          failure: function (response) {
            $("#loader").hide();
            swal('Oops','Algo deu erro ao entrar no app.','error')
          },
          error: function (response) {
            $("#loader").hide();
            swal('Oops', 'Algo deu erro ao entrar no app.', 'error')
          }
  });
  
}

function verificarAtualizarPlanoAtivos(usuario) {
    $.ajax({
        type: "POST",
        url: baseURL + "/Plano/verificar?usuario=" + usuario,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            console.log('verificação realizada');
        },
        failure: function (response) {
          
            swal('Oops', 'Algo deu erro ao entrar no app.', 'error')
        },
        error: function (response) {
           
            swal('Oops', 'Algo deu erro ao entrar no app.', 'error')
        }
    });
}

function CadastrarUsuario () {
  
  if($("#txtnome").val() == "") {
       swal("Atenção!", "Preenche o campo nome.", "warning");
       return false;
  }

  if($("#txtcpf").val() == "") {
       swal("Atenção!", "Preenche o campo cpf.", "warning");
       return false;
  }

  if($("#txtemail").val() == "") {
       swal("Atenção!", "Preenche o campo email.", "warning");
       return false;
  }

  if($("#txttelefone").val() == "") {
       swal("Atenção!", "Preenche o campo telefone.", "warning");
       return false;
  }

  if($("#txtCadLogin").val() == "") {
       swal("Atenção!", "Preenche o campo login.", "warning");
       return false;
  }

  if($("#txtCadSenha").val() == "") {
       swal("Atenção!", "Preenche o campo senha.", "warning");
       return false;
  }

  if($("#txtCadCSenha").val() == "") {
       swal("Atenção!", "Preenche o campo confirmação da senha.", "warning");
       return false;
  }

  if($("#txtCadSenha").val() != $("#txtCadCSenha").val()) {
       swal("Atenção!", "As senhas são diferentes.", "warning");
       return false;
  }

  $("#loader").show();

  var objDados = {
    nome: $("#txtnome").val(),
    cpf: $("#txtcpf").val(), 
    email: $("#txtemail").val(),
    telefone: $("#txttelefone").val(),
    usuario: $("#txtCadLogin").val(),
    senha: $("#txtCadSenha").val()
  }

  $.ajax({
          type: "POST",
          url: baseURL + "Usuario/cadastro",
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data: JSON.stringify(objDados),
          success: function (response) {
            $("#loader").hide();
           
            if(response) {
                swal({
                    title: "Sucesso!",
                    text: "Pronto agora você pode acessar o app.",
                    type: "success",
                    showCancelButton: false,
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "Entrar agora",
                    closeOnConfirm: true
                  },
                  function(){                    
                      $(".divPage").hide();
                      $("#divLogin").show();
                  });
               
            } else {
              swal('Ops!', 'Não foi possível realizar cadastro.', 'error')
            }
            
          },
          failure: function (response) {
            $("#loader").hide();
            alert(response.d);
          },
          error: function (response) {
            $("#loader").hide();
            alert(response.d);
          }
  });
  
}

function comprarCredito() {

    var valor = $("#txtCredito").val();

    if (valor == "") {
        swal('Atenção!', 'Preenche o campo com o valor desejado.', 'warning');
        return false;
    }


    $.ajax({
        type: "POST",
        url: baseURL + "/Usuario/credito?user=" + localStorage.getItem('usuId'),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: valor,
        success: function (response) {
            $("#loader").hide();
            if (response == true) {
                swal('Obrigado!', 'Compra realizada com sucesso!', 'success');
            } else {
                swal('Oops!', 'Não foi possível realizar a compra', 'error');
            } 

            retornaSaldo();
            
        },
        failure: function (response) {
            $("#loader").hide();
            alert(response.d);
        },
        error: function (response) {
            $("#loader").hide();
            alert(response.d);
        }
    });

}

function retornaSaldo() {

    $.ajax({
        type: "POST",
        url: baseURL + "/Usuario/saldo?user=" + localStorage.getItem('usuId'),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {

            $("#spSaldo, #spSaldoAtu").html("Seu Saldo: R$ " + response + ",00");   
            console.log('retorno do saldo: ' + response)

        },
        failure: function (response) {          
            alert(response.d);
        },
        error: function (response) {
            alert(response.d);
        }
    });

}

function retornaPasseAtivo() {
    $("#loader").show();
    $.ajax({
        type: "GET",
        url: baseURL + "/Plano?user=" + localStorage.getItem('usuId'),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            var pa = response;

            if (pa.pnaVoucher != 0) {
                $("#numVoucher").html(pa.pnaVoucher);
                localStorage.setItem('voucher', pa.pnaVoucher);
                localStorage.setItem('planoIdAtivo', pa.pnaId);
                $("#dtVoucherExpirta").html("Válido até: " + pa.pnaDtExpira);
                $("#rowPasses").hide();
                $("#colVoucher").show();
                retornaBikeUso(); // verifica se temos uma bike em uso
            } else {
                $("#rowPasses").show();
                $("#colVoucher").hide();
            }

            $("#loader").hide();
                        
        },
        failure: function (response) {
            $("#loader").hide();
            alert(response.d);
        },
        error: function (response) {
            $("#loader").hide();
            alert(response.d);
        }
    });
}

function showPasses() {
    $("#panelPasseAtivo").hide();
    $("#rowPasses").toggle();
}

function sair() {
    localStorage.clear();
    $(".menuLogado").hide();
    acessar('divLogin');
}

$(function() {
     //mapaEstacao();

  $("#divLogin").show();
  $('.button-collapse').sideNav({
      menuWidth: 300, // Default is 300
      edge: 'left', // Choose the horizontal origin
      closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    }
  );

  $('.modal').modal();
  app.initialize();

});




