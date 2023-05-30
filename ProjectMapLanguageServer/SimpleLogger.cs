using Microsoft.CodeAnalysis.CSharp;
using ProjectMapLanguageServer.Api;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectMapLanguageServer
{
    public class SimpleLogger
    {
        public static SimpleLogger Instance {
            get {
                if (_apiSender == null) {
                    throw new Exception("SimpleLogger not initialized");
                }

                _instance ??= new SimpleLogger();
                return _instance;
            }
        }

        protected static SimpleLogger? _instance;

        protected static ApiSender? _apiSender { get; set; }

        public LogLevel LogLevel { get; set; } = LogLevel.Debug;


        public static void Initialize(ApiSender apiSender)
        {
            _apiSender = apiSender;
        }

        protected SimpleLogger() { }

        public void Log(string log, LogLevel logLevel = LogLevel.Info) {
            if (logLevel <= LogLevel) {
                _apiSender!.SendLogMessage(log, logLevel);
                //Console.WriteLine($"{logPefix}{log}\n");
            }
        }

        public void LogError(string log) => Log(log, LogLevel.Error);

        public void LogException(Exception ex, LogLevel logLevel = LogLevel.Error) {
            Log($"EXCEPTION Type: {ex.GetType()}", logLevel);
            Log($"EXCEPTION Message: {ex.Message}", logLevel);
            Log($"EXCEPTION StackTrace: {ex.StackTrace}", logLevel);
        }
    }

    public enum LogLevel {
        Fatal = 0,
        Error = 1,
        Warning = 2,
        Info = 3,
        Debug = 4
    }
}
