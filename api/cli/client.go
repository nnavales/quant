package cli

import (
	"io"
	"net/http"
	"time"
)

var client = http.Client{
	Timeout: 3 * time.Second,
}

func requestToAPI(method, url string, body io.Reader) (code int, resBody io.ReadCloser, err error) {
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return 0, nil, err
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	res, err := client.Do(req)
	if err != nil {
		return 0, nil, err
	}

	return res.StatusCode, res.Body, nil
}
