
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
         
       
    }
};

var login = "";
var latlong = "";

function acessar(div) {
  $(".divPage").hide();
	if (div != 'divMaster'){
		$("#mapaestacoes").hide();
	} else {
		$('#hfmapa').click();
		$('ul.tabs').tabs('select_tab', 'hfmapa');
		$("#mapaestacoes").show();
	}
	
	$("#btnVoltarEstacao").hide();
  $("#" + div).show();        
}

function entrar(div) {
	$(".divPage").hide();
  $("#divLogin").hide();
	$("#btnVoltarEstacao").hide();
  $("#mapaestacoes").show();
  $("#" + div).show();
  $("#hfmapa").click();

  var sjc = {lat: -23.1899556, lng: -45.86557};
       
  var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: sjc
     });

    //resgata a localização do usuário
    navigator.geolocation.getCurrentPosition(function(position) {
              
        latlong = {lat: position.coords.latitude, lng: position.coords.longitude};
                                
        var marker = new google.maps.Marker({
          position: latlong,
          map: map
        });

        map.setCenter(latlong); //centraliza o mapa na localização atual

        //registra as localizações das estações
        var features = [
          {
            position: new google.maps.LatLng(-23.1999782, -45.8907102),
            type: 'parking',
            latlng: "-23.1999782, -45.8907102"
          }, {
            position: new google.maps.LatLng(-23.1954351, -45.900689),
            type: 'parking',
            latlng: "-23.1954351, -45.900689"
          }
        ];

        // Cria os marcadores com base nas localizações das estações.
        features.forEach(function(feature) {
          var marker = new google.maps.Marker({
            position: feature.position,
            map: map,
            icon: 'img/estation.png'
          });
          // ao clicar no marcador, exibe os detalhes da estação
          marker.addListener('click', function() {
            infoEstacao(feature.latlng);
          });
        });
                
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

          window.localStorage.setItem('login','teste');
    
    }

//cria botao ver rotas
function infoEstacao (latlng) {
   $('#modal1').modal('open');
   $("#footModalRotas").html(' <button class="modal-action modal-close waves-effect waves-green btn-flat" onclick="verRota('+ latlng +');" >Ver Rotas</button>');
}

//exibe a rota no mapa do local atual com a estação
function verRota(lat,long) {
       
        var sjc = {lat: -23.1899556, lng: -45.86557};
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer;
       
        var map = new google.maps.Map(document.getElementById('map'), {
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
		
		$("#btnVoltarEstacao").show();
		$('#modal1').modal('close');
        
}

function alugarBike() {
    	swal({
      title: "Deseja alugar esta bike?",
      text: "Será descontado 1 passe diário.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Sim",
      cancelButtonText: "Não",
      closeOnConfirm: false,
      closeOnCancel: false
    },
    function(isConfirm){
      if (isConfirm) {
        swal("Sucesso!", "Sua bike está disponível!", "success");
      } else {
        swal("Cancelado!", "Ei.. vamos dá uma volta de bike!", "error");
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
          url: "http://bikesjc.azurewebsites.net/login",
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data: JSON.stringify(objDados),
          success: function (response) {
            $("#loader").hide();
            var usuario = response;
            
            if(usuario.nome == null) {
                swal('Atenção!', 'login ou senha incorretos.', 'error')
            } else {
              $("#spNome").html("Olá, " + usuario.nome);
              Materialize.toast('Seja bem vindo ' + usuario.nome, 4000);
              entrar('divMaster');
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
    login: $("#txtCadLogin").val(),
    senha: $("#txtCadSenha").val()
  }

  $.ajax({
          type: "POST",
          url: "http://bikesjc.azurewebsites.net/cadastro/usuario",
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
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Entrar agora",
                    closeOnConfirm: false
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



$(function() {
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




