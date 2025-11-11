package api

import "github.com/gin-gonic/gin"

// Router returns the gin router (needed for middleware)
func (s *Server) Router() *gin.Engine {
	return s.router
}
