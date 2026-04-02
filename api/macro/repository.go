package macro

import "database/sql"

type Repo struct {
	db *sql.DB
}

func NewRepo(db *sql.DB) *Repo {
	return &Repo{
		db: db,
	}
}

// Como quiero que funcione este repository:
// Va a guardar:
// Series: Inflacion - IPC -  Dolar Oficial - Dolar Crypto - ETH - BTC
// Datos sueltos Riesgo Pais
// Maps de muchos datos: Dolares de Bancos - TNA - TEA - UVA
